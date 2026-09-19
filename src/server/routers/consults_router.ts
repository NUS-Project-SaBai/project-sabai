import { z } from "zod";
import { eq, desc, inArray } from "drizzle-orm";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { consults, diagnosis } from "@/db/schema/consults";
import { createConsultInput } from "@/server/schemas/consults";

export const consultsRouter = router({
  /**
   * Creates a consult and all of its diagnoses in a single transaction.
   * If any insert fails, the whole operation rolls back so nothing is
   * persisted. `doctorId` comes from the authenticated Supabase session.
   */
  create: protectedProcedure
    .input(createConsultInput)
    .mutation(async ({ input, ctx }) => {
      const { diagnoses, ...consultData } = input;

      return db.transaction(async (tx) => {
        const [consult] = await tx
          .insert(consults)
          .values({ ...consultData, doctorId: ctx.user.id })
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
});

export type CreateConsultInput = z.infer<typeof createConsultInput>;
