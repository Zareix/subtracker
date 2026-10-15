import { isSameDay } from "date-fns"
import { eq } from "drizzle-orm"

import { calculateNextPaymentDate } from "~/functions/subscriptions.functions"
import { db } from "~/lib/db"
import { categories, paymentMethods, subscriptions } from "~/lib/db/schema"

export const getDueSubscriptionsToday = async () => {
  const rows = db
    .select({
      subscription: subscriptions,
      category: categories,
      paymentMethod: paymentMethods,
    })
    .from(subscriptions)
    .innerJoin(categories, eq(subscriptions.category, categories.id))
    .innerJoin(paymentMethods, eq(subscriptions.paymentMethod, paymentMethods.id))
    .all()

  const today = new Date()

  return rows
    .map((row) => ({
      ...row.subscription,
      category: row.category,
      paymentMethod: row.paymentMethod,
      nextPaymentDate: calculateNextPaymentDate(
        row.subscription.schedule,
        row.subscription.firstPaymentDate,
      ),
    }))
    .filter((sub) => isSameDay(sub.nextPaymentDate, today))
}
