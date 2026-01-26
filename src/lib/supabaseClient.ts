import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL environment variable");
}

const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!supabasePublishableKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variable",
  );
}

/**
 * Browser client for Supabase.
 * Uses @supabase/ssr which automatically manages auth state in cookies.
 * This makes the session available to the server without exposing tokens to JS.
 */
export const supabase = createBrowserClient(
  supabaseUrl,
  supabasePublishableKey,
);
