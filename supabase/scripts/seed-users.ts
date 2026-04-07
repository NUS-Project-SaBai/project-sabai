import "dotenv/config";   
import { createClient } from "@supabase/supabase-js";import { z } from "zod";

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

const { NEXT_PUBLIC_SUPABASE_URL: supabaseUrl, SUPABASE_SECRET_KEY: supabaseSecretKey } =
  parsedEnv.data;

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
    } else {
      console.log(`Created/exists: ${u.email}`, data.user?.id);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
