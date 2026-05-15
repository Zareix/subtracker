import { createServerFn } from "@tanstack/react-start";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { env } from "~/env";
import { requireAdmin } from "~/lib/auth";
import { Currencies, SCHEDULES, UserRoles } from "~/lib/constant";
import { db, runTransaction } from "~/lib/db";
import {
  categories,
  paymentMethods,
  subscriptions,
  users,
  usersToSubscriptions,
} from "~/lib/db/schema";
import { updateExchangeRates } from "~/lib/services/exchange-rates";
import { cleanUpFiles, migrateImageToS3 } from "~/lib/services/files";
import { preprocessStringToDate } from "~/lib/utils";

export const adminCleanUpFiles = createServerFn({ method: "POST" }).handler(
  async () => {
    await requireAdmin();
    const filesInUse = (
      await Promise.all([
        db.query.subscriptions
          .findMany({
            columns: { image: true },
            where: (tb, { isNotNull }) => isNotNull(tb.image),
          })
          .then((subs) => subs.map((s) => s.image)),
        db.query.paymentMethods
          .findMany({
            columns: { image: true },
            where: (tb, { isNotNull }) => isNotNull(tb.image),
          })
          .then((pms) => pms.map((pm) => pm.image)),
      ])
    )
      .flat()
      .filter(Boolean)
      .map((file) => file.replace("/api/files?filename=", ""));

    await cleanUpFiles(filesInUse);
  },
);

export const adminMigrateImagesToS3 = createServerFn({
  method: "POST",
}).handler(async () => {
  await requireAdmin();
  if (!env.S3_ENABLED) {
    throw new Error("S3 is not configured");
  }

  const [localSubscriptions, localPaymentMethods] = await Promise.all([
    db.query.subscriptions.findMany({
      columns: { id: true, image: true },
      where: (tb, { isNotNull, not, like }) =>
        and(isNotNull(tb.image), not(like(tb.image, "%s3_%"))),
    }),
    db.query.paymentMethods.findMany({
      columns: { id: true, image: true },
      where: (tb, { isNotNull, not, like }) =>
        and(isNotNull(tb.image), not(like(tb.image, "%s3_%"))),
    }),
  ]);

  for (const sub of localSubscriptions) {
    if (!sub.image) continue;
    const newImage = await migrateImageToS3(sub.image);
    await db
      .update(subscriptions)
      .set({ image: newImage })
      .where(eq(subscriptions.id, sub.id));
  }

  for (const pm of localPaymentMethods) {
    if (!pm.image) continue;
    const newImage = await migrateImageToS3(pm.image);
    await db
      .update(paymentMethods)
      .set({ image: newImage })
      .where(eq(paymentMethods.id, pm.id));
  }

  return {
    migratedSubscriptions: localSubscriptions.length,
    migratedPaymentMethods: localPaymentMethods.length,
  };
});

export const adminUpdateExchangeRates = createServerFn({
  method: "POST",
}).handler(async () => {
  await requireAdmin();
  await updateExchangeRates();
});

export const adminExportData = createServerFn({ method: "POST" }).handler(
  async () => {
    await requireAdmin();
    const [
      allSubscriptions,
      allPaymentMethods,
      allCategories,
      allUsers,
      allUserToSubscriptions,
    ] = await Promise.all([
      db.query.subscriptions.findMany(),
      db.query.paymentMethods.findMany(),
      db.query.categories.findMany(),
      db.query.users.findMany(),
      db.query.usersToSubscriptions.findMany(),
    ]);
    return {
      subscriptions: allSubscriptions,
      paymentMethods: allPaymentMethods,
      categories: allCategories,
      users: allUsers,
      userToSubscriptions: allUserToSubscriptions,
    };
  },
);

export const adminImportData = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      subscriptions: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
          category: z.number(),
          image: z.string().nullish(),
          description: z.string(),
          price: z.number(),
          currency: z.enum(Currencies),
          paymentMethod: z.number(),
          schedule: z.enum(SCHEDULES),
          firstPaymentDate: z.preprocess(preprocessStringToDate, z.date()),
          createdAt: z.preprocess(preprocessStringToDate, z.date()),
          updatedAt: z.preprocess(preprocessStringToDate, z.date()),
        }),
      ),
      paymentMethods: z
        .array(
          z.object({
            id: z.number(),
            name: z.string(),
            image: z.string().nullish(),
          }),
        )
        .optional(),
      categories: z
        .array(
          z.object({
            id: z.number(),
            name: z.string(),
            icon: z.string(),
          }),
        )
        .optional(),
      users: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            email: z.string(),
            role: z.enum(UserRoles),
            emailVerified: z.boolean(),
            image: z.string().nullish(),
            createdAt: z.preprocess(preprocessStringToDate, z.date()),
            updatedAt: z.preprocess(preprocessStringToDate, z.date()),
          }),
        )
        .optional(),
      userToSubscriptions: z
        .array(
          z.object({
            userId: z.string(),
            subscriptionId: z.number(),
          }),
        )
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    await runTransaction(db, async (tx) => {
      if (data.users && data.users.length > 0) {
        await tx.insert(users).values(data.users);
      }
      if (data.paymentMethods && data.paymentMethods.length > 0) {
        await tx.insert(paymentMethods).values(data.paymentMethods);
      }
      if (data.categories && data.categories.length > 0) {
        await tx
          .insert(categories)
          .values(data.categories.filter((c) => c.id !== 1));
      }
      if (data.subscriptions && data.subscriptions.length > 0) {
        await tx.insert(subscriptions).values(data.subscriptions);
      }
      if (data.userToSubscriptions && data.userToSubscriptions.length > 0) {
        await tx.insert(usersToSubscriptions).values(data.userToSubscriptions);
      }
    });
  });
