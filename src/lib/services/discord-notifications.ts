import { isSameDay } from "date-fns"
import { eq } from "drizzle-orm"

import { env } from "~/env"
import { calculateNextPaymentDate } from "~/functions/subscriptions.functions"
import { CURRENCY_SYMBOLS } from "~/lib/constant"
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

export const sendDueSubscriptionsDiscordNotification = async () => {
  if (!env.DISCORD_WEBHOOK_URL) return

  const due = await getDueSubscriptionsToday()
  if (due.length === 0) return

  const fields = due.map((sub) => {
    const symbol = CURRENCY_SYMBOLS[sub.currency]
    return {
      name: sub.name,
      value: `${sub.price.toFixed(2)}${symbol}`,
      inline: true,
    }
  })

  const payload = {
    embeds: [
      {
        title: `${due.length} subscription${due.length === 1 ? "" : "s"} due today`,
        color: 2384875,
        url: env.BETTER_AUTH_URL,
        fields,
        footer: { text: "Subtracker" },
      },
    ],
  }

  console.log("Sending due subscriptions Discord notification")
  const res = await fetch(env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Discord webhook failed (${res.status}): ${text}`)
  }
}
