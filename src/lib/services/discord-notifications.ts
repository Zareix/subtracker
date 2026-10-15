import { env } from "~/env"
import { CURRENCY_SYMBOLS } from "~/lib/constant"
import { getDueSubscriptionsToday } from "~/lib/services/due-subscriptions"

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
