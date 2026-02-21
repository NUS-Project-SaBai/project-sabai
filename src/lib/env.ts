import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),

  // Database
  DATABASE_URL: z.url(),

  // Deployment
  VERCEL_URL: z.string().optional(),
  RENDER_INTERNAL_HOSTNAME: z.string().optional(),
  PORT: z.string().optional().default("3000"),

  // Node
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map(
    (i) => `${i.path.join(".")}: ${i.message}`,
  );
  throw new Error(
    `Missing or invalid environment variables: \n${issues.map((v) => `- ${v}`).join("\n")}`,
  );
}

const env = parsed.data;

export default env;
