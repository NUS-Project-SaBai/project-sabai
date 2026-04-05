import { z } from "zod";

/*
 * NEXT_PUBLIC_ prefix is required for any var that needs to be accessible in
 * the browser. Next.js statically inlines these at build time as string
 * replacements — they are NOT available by spreading process.env on the client.
 *
 * This is why each var must be passed explicitly to safeParse() rather than
 * passing process.env directly. Spreading process.env in the browser yields an
 * empty object; only process.env.NEXT_PUBLIC_FOO (referenced literally) works.
 *
 * This file is safe to import in both client and server contexts.
 */

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  VERCEL_URL: z.string().optional(),
  PORT: z.string().default("3000"),
});

const parsedClientEnv = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  VERCEL_URL: process.env.VERCEL_URL,
  PORT: process.env.PORT,
});

if (!parsedClientEnv.success) {
  const issues = parsedClientEnv.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`,
  );

  throw new Error(
    `Missing or invalid client environment variables:\n${issues.map((value) => `- ${value}`).join("\n")}`,
  );
}

const clientEnv = parsedClientEnv.data;

export default clientEnv;
