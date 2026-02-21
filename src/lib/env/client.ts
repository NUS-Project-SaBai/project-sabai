import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_VERCEL_URL: z.string().optional(),
  NEXT_PUBLIC_PORT: z.string().default("3000"),
});

const parsedClientEnv = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL,
  NEXT_PUBLIC_PORT: process.env.NEXT_PUBLIC_PORT,
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
