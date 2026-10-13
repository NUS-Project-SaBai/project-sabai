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

const serverBaseSchema = clientSchema.extend({
  VERCEL_URL: z.string().optional(),
  PORT: z.string().default("3000"),
  SUPABASE_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.url(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
});

/*
 * APP_MODE decides which services the app depends on:
 * - ONLINE: patient images live in Cloudinary and face recognition uses AWS Rekognition.
 * - OFFLINE: patient images live in the local RustFS container (infra/storage) and face
 *   recognition uses the local face service container (services/face).
 * Only the variables for the selected mode are required.
 */
const serverSchema = z.discriminatedUnion("APP_MODE", [
  serverBaseSchema.extend({
    APP_MODE: z.literal("ONLINE"),
    CLOUDINARY_URL_PREFIX: z.string().min(1),
    CLOUDINARY_URL: z.string().min(1),
    AWS_ACCESS_KEY_ID: z.string().min(1),
    AWS_SECRET_ACCESS_KEY: z.string().min(1),
    AWS_REGION: z.string().min(1),
    COLLECTION_ID: z.string().min(1),
  }),
  serverBaseSchema.extend({
    APP_MODE: z.literal("OFFLINE"),
    STORAGE_ENDPOINT: z.url(),
    STORAGE_ACCESS_KEY: z.string().min(3),
    STORAGE_SECRET_KEY: z.string().min(8),
    STORAGE_BUCKET: z.string().min(3).default("sabai"),
    FACE_SERVICE_URL: z.url(),
    FACE_SERVICE_API_KEY: z.string().min(32),
  }),
]);

/*
 * NEXT_PUBLIC_ vars must be passed explicitly (not via process.env spread) because
 * Next.js only statically inlines them as string replacements at build time —
 * spreading process.env on the client yields an empty object.
 */
const input = isServer
  ? { ...process.env, APP_MODE: process.env.APP_MODE || "ONLINE" }
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

export type ServerEnv = z.infer<typeof serverSchema>;

const envVariables = parsed.data as ServerEnv;

export default envVariables;
