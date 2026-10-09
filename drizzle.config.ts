import { defineConfig } from "drizzle-kit";
import env from "./src/lib/envVariables";

export default defineConfig({
  schema: "./src/db/schema",
  out: "./supabase/migrations", // Storing migrations in supabase folder is a good practice
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
