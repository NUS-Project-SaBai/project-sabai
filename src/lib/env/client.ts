import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const parsedClientEnv = clientEnvSchema.safeParse(process.env);

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