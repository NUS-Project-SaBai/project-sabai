import "dotenv/config";   
import { createClient } from "@supabase/supabase-js";
import env from "@/lib/env";

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseSecretKey = env.SUPABASE_SECRET_KEY; // NEVER expose to browser

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
