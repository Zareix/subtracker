import { env } from "~/env"
import { CURRENCY_SYMBOLS } from "~/lib/constant"
import { getDueSubscriptionsToday } from "~/lib/services/due-subscriptions"

export const sendDueSubscriptionsBarkNotification = async () => {
  if (!env.BARK_DEVICE_KEY) return

  const due = await getDueSubscriptionsToday()
  if (due.length === 0) return

  const body = due
    .map((sub) => {
      const symbol = CURRENCY_SYMBOLS[sub.currency]
      return `${sub.name}: ${sub.price.toFixed(2)}${symbol}`
    })
    .join("\n")

  // Bark generates one device key per device (iPhone, iPad...), so several
  // keys can be provided as a comma-separated list.
  const deviceKeys = env.BARK_DEVICE_KEY.split(",")
    .map((key) => key.trim())
    .filter(Boolean)

  const errors: string[] = []

  for (const deviceKey of deviceKeys) {
    const payload = {
      device_key: deviceKey,
      title: `${due.length} subscription${due.length === 1 ? "" : "s"} due today`,
      body,
      group: "Subtracker",
      url: env.BETTER_AUTH_URL,
    }

    console.log("Sending due subscriptions Bark notification")
    try {
      const res = await fetch(`${env.BARK_URL}/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text()
        errors.push(`device ${deviceKey.slice(0, 8)}… (${res.status}): ${text}`)
      }
    } catch (e) {
      errors.push(`device ${deviceKey.slice(0, 8)}…: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  if (errors.length > 0) {
    throw new Error(`Bark push failed: ${errors.join("; ")}`)
  }
}
