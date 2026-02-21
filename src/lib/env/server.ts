import { z } from "zod";
import clientEnv from "./client";

const serverEnvSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.url(),
  VERCEL_URL: z.string().optional(),
  RENDER_INTERNAL_HOSTNAME: z.string().optional(),
  PORT: z.string().default("3000"),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

const parsedServerEnv = serverEnvSchema.safeParse(process.env);

if (!parsedServerEnv.success) {
  const issues = parsedServerEnv.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`,
  );

  throw new Error(
    `Missing or invalid server environment variables:\n${issues.map((value) => `- ${value}`).join("\n")}`,
  );
}

const serverEnv = {
  ...clientEnv,
  ...parsedServerEnv.data,
};

export default serverEnv;