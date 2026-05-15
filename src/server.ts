import handler, { createServerEntry } from "@tanstack/react-start/server-entry";
import { paraglideMiddleware } from "./paraglide/server.js";
import { migrateDB } from "~/lib/db/migrate";
import { seed } from "~/lib/db/seed.js";
import { updateExchangeRates } from "~/lib/services/exchange-rates.js";

await migrateDB();
await seed();

await updateExchangeRates();

export default createServerEntry({
  fetch(req) {
    if (req.url.includes("/api/")) {
      return handler.fetch(req);
    }
    return paraglideMiddleware(req, () => handler.fetch(req));
  },
});
