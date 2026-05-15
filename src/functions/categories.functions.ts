import { createServerFn } from "@tanstack/react-start";
import { asc, eq } from "drizzle-orm";
import { dynamicIconImports } from "lucide-react/dynamic.mjs";
import { z } from "zod";
import { requireSession } from "~/lib/auth";
import { db, runTransaction } from "~/lib/db";
import { categories, subscriptions } from "~/lib/db/schema";
import { takeFirstOrThrow } from "~/lib/utils";

export const getCategories = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireSession();
    return await db.query.categories.findMany({
      columns: { id: true, name: true, icon: true },
      orderBy: [asc(categories.name)],
    });
  },
);

export const createCategory = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(1, "Name cannot be empty"),
      icon: z.enum(Object.keys(dynamicIconImports) as [string, ...string[]]),
    }),
  )
  .handler(async ({ data }) => {
    await requireSession();
    const category = takeFirstOrThrow(
      await db
        .insert(categories)
        .values({ name: data.name, icon: data.icon })
        .returning({
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
        }),
      "Error creating category",
    );
    return { id: category.id, name: category.name, icon: category.icon };
  });

export const editCategory = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({ id: z.number(), name: z.string(), icon: z.string() }),
  )
  .handler(async ({ data }) => {
    await requireSession();
    const category = takeFirstOrThrow(
      await db
        .update(categories)
        .set({ name: data.name, icon: data.icon })
        .where(eq(categories.id, data.id))
        .returning({
          id: categories.id,
          name: categories.name,
          icon: categories.icon,
        }),
      "Error updating category",
    );
    return { id: category.id, name: category.name, icon: category.icon };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    await requireSession();
    if (data.id === 1) {
      throw new Error("Cannot delete default category");
    }
    const category = await db.query.categories.findFirst({
      where: (tb, { eq }) => eq(tb.id, data.id),
    });
    if (!category) {
      throw new Error("Category not found");
    }
    await runTransaction(db, async (tx) => {
      await tx
        .update(subscriptions)
        .set({ category: 1 })
        .where(eq(subscriptions.category, data.id));
      await tx.delete(categories).where(eq(categories.id, data.id));
    });
    return { success: true };
  });
