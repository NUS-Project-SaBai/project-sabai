import { z } from "zod";
import { eq, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { consults, diagnosis } from "@/db/schema/consults";
import { isWithinConsultEditWindow } from "@/lib/utils/consult";
import {
  createConsultInput,
  updateConsultInput,
} from "@/server/schemas/consults";

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
   * Only the doctor who wrote the consult may edit it, and only within
   * 24 hours of creation.
   */
  update: protectedProcedure
    .input(updateConsultInput)
    .mutation(async ({ input, ctx }) => {
      const { id, diagnoses, ...fields } = input;

      const [existing] = await db
        .select({ date: consults.date, doctorId: consults.doctorId })
        .from(consults)
        .where(eq(consults.id, id));

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Consult not found.",
        });
      }

      if (existing.doctorId !== ctx.appUser.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only the doctor who wrote this consult can edit it.",
        });
      }

      if (!isWithinConsultEditWindow(existing.date)) {
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
