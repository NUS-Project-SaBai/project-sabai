import { z } from "zod";
import clientEnv from "./client";

/*
 * This file must NEVER be imported in any file that runs in the browser.
 * In the pages router there is no 'use client' directive, so the boundary is
 * enforced by convention: only import this in API routes, server-side helpers,
 * and tRPC server-side code.
 *
 * If this file is imported in a module that gets bundled for the client (e.g.
 * trpc.ts → _app.tsx), server-only vars like SUPABASE_SECRET_KEY will be
 * undefined in the browser and a validation error will be thrown at runtime.
 *
 * To add build-time enforcement of this boundary, install the 'server-only'
 * package and add `import 'server-only'` at the top of this file.
 *
 * Unlike client.ts, process.env can be spread directly here because this code
 * only ever runs in Node where process.env is a real populated object.
 */

const serverEnvSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.url(),
  CLOUDINARY_URL_PREFIX: z.string().min(1),
  CLOUDINARY_URL: z.string().min(1),
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
