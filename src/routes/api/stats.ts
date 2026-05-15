import { createFileRoute } from "@tanstack/react-router";
import {
  getAllSubscriptionsOfUser,
  getSubscriptions,
} from "~/functions/subscriptions.functions";
import { verifyApiKey } from "~/lib/auth";
import type { Currency } from "~/lib/constant";
import { SCHEDULES, type Schedule } from "~/lib/constant";
import { getStats } from "~/lib/stats";
import { currencyToSymbol, getFilteredSubscriptions } from "~/lib/utils";

export const Route = createFileRoute("/api/stats")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        let user: Awaited<ReturnType<typeof verifyApiKey>>;
        try {
          user = await verifyApiKey(request);
          if (!user) {
            return new Response("Unauthorized", { status: 401 });
          }
        } catch (error) {
          return new Response((error as Error).message || "Unauthorized", {
            status: 401,
          });
        }

        const params = new URL(request.url).searchParams;

        const usersParam = params.get("users") ?? user.id;

        const categoriesParam = params.get("categories");
        const categories = categoriesParam
          ? categoriesParam
              .split(",")
              .map(Number)
              .filter((n) => !Number.isNaN(n))
          : [];

        const paymentMethodsParam = params.get("paymentMethods");
        const paymentMethods = paymentMethodsParam
          ? paymentMethodsParam
              .split(",")
              .map(Number)
              .filter((n) => !Number.isNaN(n))
          : [];

        const scheduleParam = params.get("schedule");
        const schedule =
          scheduleParam &&
          (SCHEDULES as readonly string[]).includes(scheduleParam)
            ? (scheduleParam as Schedule)
            : null;

        const subscriptions = getFilteredSubscriptions(
          await getAllSubscriptionsOfUser({
            data: {
              userId: user.id,
              baseCurrency: user.baseCurrency as Currency,
            },
          }),
          {
            users: usersParam,
            categories,
            paymentMethods,
            schedule,
            search: "",
          },
        );

        const stats = getStats(subscriptions, { users: usersParam });

        return Response.json({
          stats: {
            totalPerMonth: stats.totalPerMonth.value,
            totalPerYear: stats.totalPerYear.value,
            totalThisMonth: stats.totalThisMonth.value,
            remainingThisMonth: stats.remainingThisMonth.value,
            expectedNextMonth: stats.expectedNextMonth.value,
          },
          currency: {
            code: user.baseCurrency,
            symbol: currencyToSymbol(user.baseCurrency),
          },
        });
      },
    },
  },
});
