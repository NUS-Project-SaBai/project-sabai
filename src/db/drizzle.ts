import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/schema";
import env from "@/lib/envVariables";

// Disable prefetch for serverless environments usually, but fine for standalone
const connectionString = env.DATABASE_URL;
const client = postgres(connectionString);

export const db = drizzle(client, { schema });
