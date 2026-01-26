import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/db/drizzle";
import { villageCodes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const villageCodeRouter = router({
  // 1. List all (with optional filter)
  list: protectedProcedure
    .input(z.object({ includeHidden: z.boolean().default(false) }))
    .query(async ({ input }) => {
      const result = db.query.villageCodes.findMany({
        where: input.includeHidden
          ? undefined
          : eq(villageCodes.isVisible, true),
        orderBy: [desc(villageCodes.createdAt)],
      });
      return await result;
    }),

  // 2. Get by ID
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const result = await db.query.villageCodes.findFirst({
        where: eq(villageCodes.id, input.id),
      });
      return result || null;
    }),

  // 3. Create
  create: protectedProcedure
    .input(
      z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        colorHex: z
          .string()
          .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid Hex"),
        isVisible: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input }) => {
      // .returning() is crucial in Postgres to get the inserted object back
      const [newCode] = await db.insert(villageCodes).values(input).returning();
      return newCode;
    }),

  // 4. Update
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        // Partial updates
        name: z.string().optional(),
        colorHex: z
          .string()
          .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
          .optional(),
        isVisible: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      const [updated] = await db
        .update(villageCodes)
        .set(data)
        .where(eq(villageCodes.id, id))
        .returning();

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Village code not found",
        });
      }

      return updated;
    }),

  // 5. Delete
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const [deleted] = await db
        .delete(villageCodes)
        .where(eq(villageCodes.id, input.id))
        .returning();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Village code not found",
        });
      }

      return deleted;
    }),
});
