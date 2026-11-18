import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/drizzle";
import { router, protectedProcedure } from "@/server/trpc";
import { referralPartners } from "@/db/schema/referralPartners";
import {
  createPartnerInput,
  updatePartnerInput,
} from "@/server/schemas/referralPartners";

export const referralPartnersRouter = router({
  list: protectedProcedure.query(async () => {
    return await db
      .select()
      .from(referralPartners)
      .orderBy(asc(referralPartners.name));
  }),

  create: protectedProcedure
    .input(createPartnerInput)
    .mutation(async ({ input }) => {
      const [newPartner] = await db
        .insert(referralPartners)
        .values(input)
        .returning();
      return newPartner;
    }),

  update: protectedProcedure
    .input(updatePartnerInput)
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      const [updated] = await db
        .update(referralPartners)
        .set(data)
        .where(eq(referralPartners.id, id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Referral partner not found",
        });
      }
      return updated;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.uuid() }))
    .mutation(async ({ input }) => {
      const [deleted] = await db
        .delete(referralPartners)
        .where(eq(referralPartners.id, input.id))
        .returning({ id: referralPartners.id });

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Referral partner not found",
        });
      }
      return deleted;
    }),
});
