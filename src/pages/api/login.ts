// pages/api/auth/login.ts  (for Postman testing only)
import { createServerClient, serializeCookieHeader } from "@supabase/ssr";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.appendHeader(
              "Set-Cookie",
              serializeCookieHeader(name, value, options),
            );
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.signInWithPassword({
    email: req.body.email,
    password: req.body.password,
  });

  if (error) return res.status(401).json({ error: error.message });
  return res.status(200).json({ user: data.user });
}
