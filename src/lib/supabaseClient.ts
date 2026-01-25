import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

const supabaseSecretKey = process.env.NEXT_PUBLIC_SUPABASE_SECRET_KEY;
if (!supabaseSecretKey) {
  throw new Error("Missing SUPABASE_SECRET_KEY environment variable");
}

export const supabase = createClient(supabaseUrl, supabaseSecretKey);
