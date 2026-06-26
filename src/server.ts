import handler, { createServerEntry } from "@tanstack/react-start/server-entry"

import { migrateDB } from "~/lib/db/migrate"
import { seed } from "~/lib/db/seed.js"
import { sendDueSubscriptionsDiscordNotification } from "~/lib/services/discord-notifications"
import { updateExchangeRates } from "~/lib/services/exchange-rates.js"

import { env } from "./env.js"
import { paraglideMiddleware } from "./paraglide/server.js"

await migrateDB()
await seed()

try {
  await updateExchangeRates()
} catch (e) {
  console.error("Failed to update exchange rates", e)
}

if (env.DISCORD_WEBHOOK_URL) {
  console.log("Scheduling due subscriptions Discord notification")
  Bun.cron("0 7 * * *", async () => {
    try {
      await sendDueSubscriptionsDiscordNotification()
    } catch (e) {
      console.error("Failed to send due subscriptions Discord notification", e)
    }
  })
}

export default createServerEntry({
  fetch(req) {
    if (req.url.includes("/api/")) {
      return handler.fetch(req)
    }
    return paraglideMiddleware(req, () => handler.fetch(req))
  },
})
