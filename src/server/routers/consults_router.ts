import { z } from "zod";
import { eq, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { consults, diagnosis } from "@/db/schema/consults";
import {
  DIAGNOSIS_CATEGORIES,
  CONSULT_EDIT_WINDOW_MS,
} from "@/lib/constants/consults";

/**
 * Validation schema for a single diagnosis attached to a consult.
 * Each diagnosis needs free-text details plus a category from the fixed
 * clinical list.
 */
const diagnosisInput = z.object({
  details: z.string().trim().min(1, "Diagnosis details are required"),
  category: z.enum(DIAGNOSIS_CATEGORIES),
});

/**
 * Input validation schema for creating a consult together with its diagnoses.
 * `doctorId` is intentionally omitted — it is derived from the authenticated
 * session, never trusted from the client.
 */
const consultFields = z.object({
  pastMedicalHistory: z.string().trim().optional(),
  consultation: z.string().trim().optional(),
  treatmentPlan: z.string().trim().optional(),
  remarks: z.string().trim().optional(),
  diagnoses: z
    .array(diagnosisInput)
    .min(1, "At least one diagnosis is required"),
});

const createConsultInput = z.object({
  visitId: z.number().int().positive(),
  ...consultFields.shape,
});

export const consultsRouter = router({
  /**
   * Creates a consult and all of its diagnoses in a single transaction.
   * If any insert fails, the whole operation rolls back so nothing is
   * persisted. `doctorId` is the public.users id of the logged-in account.
   */
  create: protectedProcedure
    .input(createConsultInput)
    .mutation(async ({ input, ctx }) => {
      const { diagnoses, ...consultData } = input;

      return db.transaction(async (tx) => {
        const [consult] = await tx
          .insert(consults)
          .values({ ...consultData, doctorId: ctx.appUser.id })
          .returning();

        if (diagnoses.length > 0) {
          await tx.insert(diagnosis).values(
            diagnoses.map((d) => ({
              details: d.details,
              category: d.category,
              consultId: consult.id,
            })),
          );
        }

        return consult;
      });
    }),

  /**
   * Retrieves all consults for a visit, most recent first.
   */
  getByVisitId: protectedProcedure
    .input(z.object({ visitId: z.number().int().positive() }))
    .query(async ({ input }) => {
      const rows = await db
        .select()
        .from(consults)
        .where(eq(consults.visitId, input.visitId))
        .orderBy(desc(consults.date));

      const ids = rows.map((c) => c.id);
      const diagnoses = ids.length
        ? await db
            .select()
            .from(diagnosis)
            .where(inArray(diagnosis.consultId, ids))
        : [];

      return rows.map((consult) => ({
        ...consult,
        diagnoses: diagnoses.filter((d) => d.consultId === consult.id),
      }));
    }),

  /**
   * Updates an existing consult and replaces all of its diagnoses.
   * Rejects updates on consults older than 24 hours.
   */
  update: protectedProcedure
    .input(
      z.object({ id: z.number().int().positive(), ...consultFields.shape }),
    )
    .mutation(async ({ input }) => {
      const { id, diagnoses, ...fields } = input;

      const [existing] = await db
        .select({ date: consults.date })
        .from(consults)
        .where(eq(consults.id, id));

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Consult not found.",
        });
      }

      const ageMs = Date.now() - new Date(existing.date).getTime();
      if (ageMs > CONSULT_EDIT_WINDOW_MS) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "This consult can no longer be edited (24-hour window has passed).",
        });
      }

      return db.transaction(async (tx) => {
        const [updated] = await tx
          .update(consults)
          .set(fields)
          .where(eq(consults.id, id))
          .returning();

        await tx.delete(diagnosis).where(eq(diagnosis.consultId, id));

        await tx.insert(diagnosis).values(
          diagnoses.map((d) => ({
            details: d.details,
            category: d.category,
            consultId: id,
          })),
        );

        return updated;
      });
    }),
});

export type CreateConsultInput = z.infer<typeof createConsultInput>;
