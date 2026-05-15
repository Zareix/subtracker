import handler from "@tanstack/react-start/server-entry";
import { paraglideMiddleware } from "./paraglide/server.js";
import { migrateDB } from "~/lib/db/migrate";
import { seed } from "~/lib/db/seed.js";
import { updateExchangeRates } from "~/lib/services/exchange-rates.js";

await migrateDB();
await seed();

await updateExchangeRates();

export default {
  fetch(req: Request): Promise<Response> {
    return paraglideMiddleware(req, () => handler.fetch(req));
  },
};
