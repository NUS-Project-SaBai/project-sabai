// One-off import of the member roster into public.users, linking each member to
// their Supabase login by email. The email is only used for matching here and is
// not stored in public.users (auth.users stays the single source of truth).
//
// Do NOT commit the roster CSV: it contains members' personal data.
//
// Usage:
//   pnpm import:users path/to/roster.csv
//
//   CSV header: name,email,year,team,role,remarks
//   Leave email empty for members without a login.
//   Connects to DATABASE_URL (from .env or the environment).
//
// Safe to run before or after migration 0028: if 0028 already created a
// placeholder row for a login, that row is updated in place (keeping its ID, so
// existing consults / stock_changes references stay valid).

import "dotenv/config";
import { createReadStream, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import postgres from "postgres";
import { z } from "zod";

const importUsersEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
});

const parsedEnv = importUsersEnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`,
  );

  throw new Error(
    `Missing or invalid environment variables for import-users:\n${issues.map((value) => `- ${value}`).join("\n")}`,
  );
}

const csvArg = process.argv[2];

if (!csvArg) {
  console.error("Usage: pnpm import:users path/to/roster.csv");
  process.exit(1);
}

const csvPath = resolve(csvArg);

if (!existsSync(csvPath)) {
  console.error(`CSV file not found: ${csvPath}`);
  process.exit(1);
}

const sql = postgres(parsedEnv.data.DATABASE_URL, {
  onnotice: () => {},
});

async function main() {
  const { imported, unmatched, skipped } = await sql.begin(async (tx) => {
    await tx`
      CREATE TEMP TABLE users_import (LIKE public.users INCLUDING DEFAULTS) ON COMMIT DROP
    `;
    await tx`ALTER TABLE users_import ADD COLUMN email text`;

    const copyStream = await tx`
      COPY users_import (name, email, year, team, role, remarks)
      FROM STDIN WITH (FORMAT csv, HEADER true)
    `.writable();
    await pipeline(createReadStream(csvPath), copyStream);

    // Members without a login have nothing to conflict on, so re-running the
    // import would insert them again. Skip any whose name (ignoring case and
    // surrounding spaces) already belongs to a user without a login.
    await tx`
      CREATE TEMP TABLE users_import_skipped ON COMMIT DROP AS
      SELECT i.name
      FROM users_import i
      LEFT JOIN auth.users a ON lower(a.email) = lower(trim(i.email))
      WHERE a.id IS NULL
        AND EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.auth_user_id IS NULL
            AND lower(trim(u.name)) = lower(trim(i.name))
        )
    `;
    const skipped = await tx<{ name: string }[]>`
      SELECT name FROM users_import_skipped
    `;

    // Emails that did not match any login. These members are still imported,
    // but with no login linked.
    const unmatched = await tx<{ name: string; email: string }[]>`
      SELECT i.name, i.email
      FROM users_import i
      WHERE NULLIF(trim(i.email), '') IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM auth.users a WHERE lower(a.email) = lower(trim(i.email))
        )
        AND NOT EXISTS (
          SELECT 1 FROM users_import_skipped s WHERE s.name = i.name
        )
    `;

    // A duplicate email in the roster makes this fail ("cannot affect row a
    // second time" / unique violation) instead of linking two members to one
    // login. The whole import is rolled back in that case.
    const imported = await tx`
      INSERT INTO public.users (name, year, team, role, remarks, auth_user_id)
      SELECT i.name, i.year, i.team, i.role, i.remarks, a.id
      FROM users_import i
      LEFT JOIN auth.users a ON lower(a.email) = lower(trim(i.email))
      WHERE a.id IS NOT NULL
        OR NOT EXISTS (
          SELECT 1 FROM users_import_skipped s WHERE s.name = i.name
        )
      ON CONFLICT (auth_user_id) DO UPDATE
      SET name = EXCLUDED.name,
          year = EXCLUDED.year,
          team = EXCLUDED.team,
          role = EXCLUDED.role,
          remarks = EXCLUDED.remarks,
          updated_at = now()
    `;

    return { imported: imported.count, unmatched, skipped };
  });

  console.log(`Imported/updated ${imported} users from ${csvPath}`);

  if (skipped.length > 0) {
    console.warn(
      `\nSkipped ${skipped.length} member(s) without a login who already exist:`,
    );
    for (const row of skipped) {
      console.warn(`- ${row.name}`);
    }
  }

  if (unmatched.length > 0) {
    console.warn(
      `\n${unmatched.length} email(s) did not match any login (imported without a linked login). Check for typos:`,
    );
    for (const row of unmatched) {
      console.warn(`- ${row.name} <${row.email}>`);
    }
  }
}

main()
  .catch((error) => {
    console.error("import-users failed:", error);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
