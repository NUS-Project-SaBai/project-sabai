import "dotenv/config";
import { z } from "zod";
import { db } from "@/db/drizzle";
import { visits } from "@/db/schema";

const seedVisitsEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
});

const parsedEnv = seedVisitsEnvSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const issues = parsedEnv.error.issues.map(
    (issue) => `${issue.path.join(".")}: ${issue.message}`,
  );

  throw new Error(
    `Missing or invalid environment variables for seed-visits:\n${issues.map((value) => `- ${value}`).join("\n")}`,
  );
}

async function main() {
  const visitsToCreate = [
    {
      date: new Date("2024-01-15"),
      patientId: 1,
      villageCodeId: 2,
    },
    {
      date: new Date("2024-02-20"),
      patientId: 2,
      villageCodeId: 3,
    },
    {
      date: new Date("2024-03-10"),
      patientId: 3,
      villageCodeId: 4,
    },
    {
      date: new Date("2024-04-05"),
      patientId: 1,
      villageCodeId: 2,
    },
    {
      date: new Date("2024-05-12"),
      patientId: 2,
      villageCodeId: 3,
    },
  ];

  for (const visit of visitsToCreate) {
    try {
      const [newVisit] = await db.insert(visits).values(visit).returning();
      console.log(`Created visit:`, newVisit.id);
    } catch (error) {
      console.error(`Failed to create visit:`, error);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});