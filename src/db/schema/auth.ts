import { pgSchema, uuid } from "drizzle-orm/pg-core";

// Stub for Supabase-managed auth schema — not migrated, used only for FK references
const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});
