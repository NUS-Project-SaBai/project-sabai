import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const seedUsersEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
});

const parsedEnv = seedUsersEnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`,
  );

  throw new Error(
    `Missing or invalid environment variables for seed-users:\n${issues.map((value) => `- ${value}`).join("\n")}`,
  );
}

const {
  NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
  SUPABASE_SECRET_KEY: supabaseSecretKey,
} = parsedEnv.data;

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  const usersToCreate = [
    {
      email: "user@test.com",
      password: "password123",
      user_metadata: {
        display_name: "Regular User",
        role: "member",
      },
    },
    {
      email: "admin@test.com",
      password: "password123",
      user_metadata: {
        display_name: "Admin User",
        role: "admin",
      },
    },
  ];

  for (const u of usersToCreate) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: u.user_metadata,
    });

    if (error) {
      console.error(`Failed to create ${u.email}:`, error.message);
      continue;
    }
    console.log(`Created: ${u.email}`, data.user.id);

    // Every login must be linked to a public.users row (the app rejects
    // unlinked logins), so create one for each seeded account.
    const { error: linkError } = await supabase
      .from("users")
      .upsert(
        { auth_user_id: data.user.id, name: u.user_metadata.display_name },
        { onConflict: "auth_user_id" },
      );

    if (linkError) {
      console.error(
        `Failed to link ${u.email} to public.users:`,
        linkError.message,
      );
    }
  }

  // A user without a login, like a past member who is still referenced in
  // historical records.
  const noLoginUser = {
    name: "No Login User",
    year: "dr",
    team: "PL",
    role: "PL Head",
  };
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("name", noLoginUser.name)
    .is("auth_user_id", null)
    .limit(1);

  if (!existing?.length) {
    const { error: noLoginError } = await supabase
      .from("users")
      .insert(noLoginUser);
    if (noLoginError) {
      console.error(
        "Failed to create user without login:",
        noLoginError.message,
      );
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
