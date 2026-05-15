import { createServerFn } from "@tanstack/react-start";
import { addMonths, addYears, endOfDay, isBefore } from "date-fns";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { requireSession } from "~/lib/auth";
import {
  Currencies,
  type Currency,
  DEFAULT_BASE_CURRENCY,
  SCHEDULES,
} from "~/lib/constant";
import { db, runTransaction } from "~/lib/db";
import {
  type Category,
  categories,
  type ExchangeRate,
  type PaymentMethod,
  paymentMethods,
  type Subscription,
  subscriptions,
  type User,
  users,
  usersToSubscriptions,
} from "~/lib/db/schema";
import { searchImages } from "~/lib/services/image-search";
import { rounded, takeFirstOrNull } from "~/lib/utils";

const convertToDefaultCurrency = (
  exchangeRates: Array<ExchangeRate>,
  price: number,
  baseCurrency: string,
  targetCurrency: Currency,
) => {
  if (baseCurrency === targetCurrency) {
    return price;
  }

  const exchangeRate = exchangeRates.find(
    (r) =>
      r.baseCurrency === baseCurrency && r.targetCurrency === targetCurrency,
  )?.rate;

  if (!exchangeRate) {
    return price;
  }

  return price * exchangeRate;
};

const calculateNextPaymentDate = (
  schedule: Subscription["schedule"],
  firstPaymentDate: Subscription["firstPaymentDate"],
) => {
  const firstPaymentDateDetails = {
    base: firstPaymentDate,
    year: firstPaymentDate.getFullYear(),
    month: firstPaymentDate.getMonth(),
    day: firstPaymentDate.getDate(),
  };
  const currentDateInfo = {
    base: new Date(),
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    day: new Date().getDate(),
  };

  if (firstPaymentDateDetails.base > currentDateInfo.base) {
    return endOfDay(firstPaymentDate);
  }

  switch (schedule) {
    case "Monthly": {
      const res = new Date(
        currentDateInfo.year,
        currentDateInfo.month,
        firstPaymentDateDetails.day,
      );
      if (res > currentDateInfo.base) return res;
      return addMonths(res, 1);
    }
    case "Quarterly": {
      const res = new Date(
        currentDateInfo.year,
        currentDateInfo.month,
        firstPaymentDateDetails.day,
      );
      if (res > currentDateInfo.base) return res;
      return addMonths(res, 3);
    }
    case "Semiannual": {
      const res = new Date(
        currentDateInfo.year,
        currentDateInfo.month,
        firstPaymentDateDetails.day,
      );
      if (res > currentDateInfo.base) return res;
      return addMonths(res, 6);
    }
    case "Yearly": {
      const res = new Date(
        currentDateInfo.year,
        firstPaymentDateDetails.month,
        firstPaymentDateDetails.day,
        23,
        59,
        59,
        999,
      );
      if (res > currentDateInfo.base) return res;
      return addYears(res, 1);
    }
  }
};

const calculateSecondNextPaymentDate = (
  schedule: Subscription["schedule"],
  nextPaymentDate: Date,
) => {
  switch (schedule) {
    case "Monthly":
      return addMonths(nextPaymentDate, 1);
    case "Quarterly":
      return addMonths(nextPaymentDate, 3);
    case "Semiannual":
      return addMonths(nextPaymentDate, 6);
    case "Yearly":
      return addYears(nextPaymentDate, 1);
  }
};

const calculatePreviousPaymentDate = (
  schedule: Subscription["schedule"],
  firstPaymentDate: Subscription["firstPaymentDate"],
  nextPaymentDate: Date,
) => {
  switch (schedule) {
    case "Yearly": {
      const previousPayment = addYears(nextPaymentDate, -1);
      if (isBefore(previousPayment, firstPaymentDate)) return firstPaymentDate;
      return previousPayment;
    }
    case "Quarterly": {
      const previousPayment = addMonths(nextPaymentDate, -3);
      if (isBefore(previousPayment, firstPaymentDate)) return firstPaymentDate;
      return previousPayment;
    }
    case "Semiannual": {
      const previousPayment = addMonths(nextPaymentDate, -6);
      if (isBefore(previousPayment, firstPaymentDate)) return firstPaymentDate;
      return previousPayment;
    }
    case "Monthly": {
      const previousPayment = addMonths(nextPaymentDate, -1);
      if (isBefore(previousPayment, firstPaymentDate)) return firstPaymentDate;
      return previousPayment;
    }
  }
};

const getAllSubscriptionsOfUser = async (
  userId: string,
  baseCurrency?: Currency,
) => {
  const [rows, exchangeRates] = await Promise.all([
    db
      .select()
      .from(subscriptions)
      .innerJoin(
        usersToSubscriptions,
        eq(subscriptions.id, usersToSubscriptions.subscriptionId),
      )
      .innerJoin(users, eq(usersToSubscriptions.userId, users.id))
      .innerJoin(
        paymentMethods,
        eq(subscriptions.paymentMethod, paymentMethods.id),
      )
      .innerJoin(categories, eq(subscriptions.category, categories.id))
      .orderBy(asc(subscriptions.name))
      .all(),
    db.query.exchangeRates.findMany(),
  ]);

  const userBaseCurrency = baseCurrency ?? DEFAULT_BASE_CURRENCY;

  return rows
    .reduce<
      Array<
        Omit<Subscription, "paymentMethod" | "category"> & {
          paymentMethod: PaymentMethod;
          category: Category;
          users: Array<User>;
        }
      >
    >((acc, row) => {
      const user = row.user;
      const subscription = row.subscription;

      const existingSubscription = acc.find((s) => s.id === subscription.id);
      if (existingSubscription) {
        existingSubscription.users.push(user);
        return acc;
      }

      acc.push({
        ...subscription,
        users: [user],
        paymentMethod: row.payment_method,
        category: row.category,
      });
      return acc;
    }, [])
    .filter((subscription) =>
      subscription.users.some((user) => user.id === userId),
    )
    .map((subscription) => {
      const nextPaymentDate = calculateNextPaymentDate(
        subscription.schedule,
        subscription.firstPaymentDate,
      );
      const secondNextPaymentDate = calculateSecondNextPaymentDate(
        subscription.schedule,
        nextPaymentDate,
      );
      const previousPaymentDate = calculatePreviousPaymentDate(
        subscription.schedule,
        subscription.firstPaymentDate,
        nextPaymentDate,
      );
      return {
        ...subscription,
        originalPrice: subscription.price,
        price: rounded(
          convertToDefaultCurrency(
            exchangeRates,
            subscription.price,
            subscription.currency,
            userBaseCurrency,
          ),
        ),
        nextPaymentDate,
        secondNextPaymentDate,
        previousPaymentDate,
      };
    });
};

const subscriptionInputSchema = z.object({
  name: z.string(),
  description: z.string(),
  category: z.number(),
  image: z.string().optional(),
  price: z.number(),
  currency: z.enum(Currencies),
  paymentMethod: z.number(),
  firstPaymentDate: z.string().transform((s) => new Date(s)),
  schedule: z.enum(SCHEDULES),
  payedBy: z.array(z.string()),
  url: z.url().optional(),
});

export const getSubscriptions = createServerFn({ method: "GET" }).handler(
  async () => {
    const session = await requireSession();
    return getAllSubscriptionsOfUser(
      session.user.id,
      session.user.baseCurrency as Currency | undefined,
    );
  },
);

export const createSubscription = createServerFn({ method: "POST" })
  .inputValidator(subscriptionInputSchema)
  .handler(async ({ data }) => {
    const session = await requireSession();
    if (!data.payedBy.includes(session.user.id)) {
      throw new Error("The creator must be included in the users who pay");
    }
    const subscription = await runTransaction(db, async (tx) => {
      const sub = takeFirstOrNull(
        await tx
          .insert(subscriptions)
          .values({
            name: data.name,
            description: data.description,
            category: data.category,
            image: data.image,
            price: data.price,
            currency: data.currency,
            paymentMethod: data.paymentMethod,
            firstPaymentDate: endOfDay(data.firstPaymentDate),
            schedule: data.schedule,
            url: data.url,
          })
          .returning({ id: subscriptions.id }),
      );
      if (!sub) throw new Error("Error creating subscription");
      await Promise.all(
        data.payedBy.map((userId) =>
          tx.insert(usersToSubscriptions).values({
            userId,
            subscriptionId: sub.id,
          }),
        ),
      );
      return sub;
    });
    return { id: subscription.id };
  });

export const editSubscription = createServerFn({ method: "POST" })
  .inputValidator(subscriptionInputSchema.extend({ id: z.number() }))
  .handler(async ({ data }) => {
    const session = await requireSession();
    if (!data.payedBy.includes(session.user.id)) {
      throw new Error("The creator must be included in the users who pay");
    }
    const subscription = await runTransaction(db, async (tx) => {
      const sub = takeFirstOrNull(
        await tx
          .update(subscriptions)
          .set({
            name: data.name,
            category: data.category,
            description: data.description,
            image: data.image,
            price: data.price,
            currency: data.currency,
            paymentMethod: data.paymentMethod,
            firstPaymentDate: endOfDay(data.firstPaymentDate),
            schedule: data.schedule,
            url: data.url,
          })
          .where(eq(subscriptions.id, data.id))
          .returning({ id: subscriptions.id }),
      );
      if (!sub) throw new Error("Error updating subscription");
      await tx
        .delete(usersToSubscriptions)
        .where(eq(usersToSubscriptions.subscriptionId, data.id));
      await Promise.all(
        data.payedBy.map((userId) =>
          tx.insert(usersToSubscriptions).values({
            userId,
            subscriptionId: sub.id,
          }),
        ),
      );
      return sub;
    });
    return { id: subscription.id };
  });

export const deleteSubscription = createServerFn({ method: "POST" })
  .inputValidator(z.object({ id: z.number() }))
  .handler(async ({ data }) => {
    await requireSession();
    await runTransaction(db, async (tx) => {
      await tx
        .delete(usersToSubscriptions)
        .where(eq(usersToSubscriptions.subscriptionId, data.id));
      await tx.delete(subscriptions).where(eq(subscriptions.id, data.id));
    });
  });

export const searchSubscriptionImages = createServerFn({ method: "GET" })
  .inputValidator(z.object({ query: z.string() }))
  .handler(async ({ data }) => {
    await requireSession();
    return searchImages(data.query);
  });

export type SubscriptionItem = Awaited<
  ReturnType<typeof getAllSubscriptionsOfUser>
>[number];
