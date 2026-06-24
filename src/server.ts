import handler, { createServerEntry } from "@tanstack/react-start/server-entry"

import { migrateDB } from "~/lib/db/migrate"
import { seed } from "~/lib/db/seed.js"
import { updateExchangeRates } from "~/lib/services/exchange-rates.js"

import { paraglideMiddleware } from "./paraglide/server.js"

await migrateDB()
await seed()

try {
  await updateExchangeRates()
} catch (e) {
  console.error("Failed to update exchange rates", e)
}

export default createServerEntry({
  fetch(req) {
    if (req.url.includes("/api/")) {
      return handler.fetch(req)
    }
    return paraglideMiddleware(req, () => handler.fetch(req))
  },
})
