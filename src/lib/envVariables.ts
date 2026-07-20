import { z } from "zod";

/*
 * Consolidated environment variable validation for both client and server contexts.
 *
 * On the server, all variables are validated. On the client, only NEXT_PUBLIC_
 * variables are included in the schema — server vars are excluded entirely,
 * so validation never attempts to access them in the browser. This is necessary as
 * only env vars prefixed with NEXT_PUBLIC_ are available client-side.
 *
 * This (according to Claude) mirrors how t3-env works internally: it builds a different
 * schema shape depending on typeof window, rather than deferring or lazily evaluating.
 * Just using t3-env would probably work too... kinda just wanted to figure it out
 */

const isServer = typeof window === "undefined";

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const serverSchema = clientSchema.extend({
  VERCEL_URL: z.string().optional(),
  PORT: z.string().default("3000"),
  SUPABASE_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.url(),
  CLOUDINARY_URL_PREFIX: z.string().min(1),
  CLOUDINARY_URL: z.string().min(1),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_REGION: z.string().min(1),
  COLLECTION_ID: z.string().min(1),
});

/*
 * NEXT_PUBLIC_ vars must be passed explicitly (not via process.env spread) because
 * Next.js only statically inlines them as string replacements at build time —
 * spreading process.env on the client yields an empty object.
 */
const input = isServer
  ? process.env
  : {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    };

const parsed = isServer
  ? serverSchema.safeParse(input)
  : clientSchema.safeParse(input);

if (!parsed.success) {
  const issues = parsed.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`,
  );

  throw new Error(
    `Missing or invalid environment variables:\n${issues.map((value) => `- ${value}`).join("\n")}`,
  );
}

const envVariables = parsed.data as z.infer<typeof serverSchema>;

export default envVariables;
