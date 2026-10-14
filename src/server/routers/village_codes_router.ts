import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "@/server/trpc";
import { db } from "@/db/drizzle";
import { villageCodes } from "@/db/schema/villageCodes";
import { eq, desc, ne, and } from "drizzle-orm";

export const villageCodesRouter = router({
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
      // Reject a village code that is the same as another existing village code
      const [conflict] = await db
        .select({ id: villageCodes.id })
        .from(villageCodes)
        .where(
          eq(villageCodes.code, input.code)
        )
        .limit(1);

      if (conflict) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Another village already has this code.",
        });
      }

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
        code: z.string().optional(),
        colorHex: z
          .string()
          .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
          .optional(),
        isVisible: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;

      // Reject a village code that is the same as another existing village code
      if (data.code) {
        const [conflict] = await db
          .select({ id: villageCodes.id })
          .from(villageCodes)
          .where(
            and(
              eq(villageCodes.code, data.code),
              ne(villageCodes.id, id),
            ),
          )
          .limit(1);

        if (conflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Another village already has this code.",
          });
        }
      }

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
