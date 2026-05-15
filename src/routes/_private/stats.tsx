import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { InfoIcon } from "lucide-react";
import { Label, Pie, PieChart } from "recharts";
import { FiltersButton } from "~/components/subscriptions/filters";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Skeleton } from "~/components/ui/skeleton";
import { getSubscriptions } from "~/functions/subscriptions.functions";
import type { SubscriptionItem } from "~/functions/subscriptions.functions";
import { authClient } from "~/lib/auth-client";
import { CURRENCY_SYMBOLS, DEFAULT_BASE_CURRENCY } from "~/lib/constant";
import { useFilters } from "~/lib/hooks/use-filters";
import { type BreakdownItem, getStats } from "~/lib/stats";
import {
  currencyToSymbol,
  getFilteredSubscriptions,
  rounded,
} from "~/lib/utils";
import { m } from "~/paraglide/messages";

export const Route = createFileRoute("/_private/stats")({
  component: StatsPage,
});

type ChartFillColor = `var(--chart-${number})`;

function StatsPage() {
  const [filters] = useFilters();
  const subscriptionsQuery = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => getSubscriptions(),
  });
  const { data: session } = authClient.useSession();

  const userBaseCurrency = session?.user?.baseCurrency ?? DEFAULT_BASE_CURRENCY;
  const isLoading = subscriptionsQuery.isLoading;

  const subscriptions = getFilteredSubscriptions(
    subscriptionsQuery.data ?? [],
    { ...filters, schedule: null },
  );

  const monthlySubscriptions = subscriptions.filter(
    (s) => s.schedule === "Monthly",
  );
  const quarterlySubscriptions = subscriptions.filter(
    (s) => s.schedule === "Quarterly",
  );
  const semiannualSubscriptions = subscriptions.filter(
    (s) => s.schedule === "Semiannual",
  );
  const yearlySubscriptions = subscriptions.filter(
    (s) => s.schedule === "Yearly",
  );

  const stats = getStats(subscriptions, filters);
  const categoriesFillColor = Array.from(
    new Set(subscriptions.map((s) => s.category.name)),
  ).reduce(
    (acc, category, index) => {
      acc[category] = `var(--chart-${(index + 1) % 5})`;
      return acc;
    },
    {} as Record<string, ChartFillColor>,
  );

  if (subscriptionsQuery.isError) {
    return (
      <div>
        {m.stats_error()}: {subscriptionsQuery.error?.message}
      </div>
    );
  }

  return (
    <div>
      <header className="flex items-center justify-between">
        <h1 className="font-bold text-3xl">{m.stats_title()}</h1>
        <FiltersButton
          filtersDisplayed={["users", "paymentMethods", "categories"]}
        />
      </header>
      <div className="mt-2 grid gap-2 md:auto-rows-auto md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <MonthlyStatsCard
          title={m.stats_monthly_sub()}
          subscriptions={monthlySubscriptions}
          isLoading={isLoading}
          userBaseCurrency={userBaseCurrency}
          categoriesFillColor={categoriesFillColor}
          filters={filters}
        />
        <MonthlyStatsCard
          title={m.stats_quarterly_sub()}
          subscriptions={quarterlySubscriptions}
          isLoading={isLoading}
          userBaseCurrency={userBaseCurrency}
          categoriesFillColor={categoriesFillColor}
          filters={filters}
        />
        <MonthlyStatsCard
          title={m.stats_semiannual_sub()}
          subscriptions={semiannualSubscriptions}
          isLoading={isLoading}
          userBaseCurrency={userBaseCurrency}
          categoriesFillColor={categoriesFillColor}
          filters={filters}
        />
        <MonthlyStatsCard
          title={m.stats_yearly_sub()}
          subscriptions={yearlySubscriptions}
          isLoading={isLoading}
          userBaseCurrency={userBaseCurrency}
          categoriesFillColor={categoriesFillColor}
          filters={filters}
        />
        <StatsCard
          title={m.stats_smoothed_month_title()}
          description={m.stats_smoothed_month_description()}
          value={stats.totalPerMonth.value}
          isLoading={isLoading}
          userBaseCurrency={userBaseCurrency}
          breakdown={stats.totalPerMonth.breakdown}
        />
        <StatsCard
          title={m.stats_smoothed_year_title()}
          description={m.stats_smoothed_year_description()}
          value={stats.totalPerYear.value}
          isLoading={isLoading}
          userBaseCurrency={userBaseCurrency}
          breakdown={stats.totalPerYear.breakdown}
        />
        <StatsCard
          title={m.stats_this_month_title()}
          description={m.stats_this_month_description()}
          value={stats.totalThisMonth.value}
          isLoading={isLoading}
          userBaseCurrency={userBaseCurrency}
          breakdown={stats.totalThisMonth.breakdown}
        />
        <StatsCard
          title={m.stats_remaining_month_title()}
          description={m.stats_remaining_month_description()}
          value={stats.remainingThisMonth.value}
          isLoading={isLoading}
          userBaseCurrency={userBaseCurrency}
          breakdown={stats.remainingThisMonth.breakdown}
        />
        <StatsCard
          title={m.stats_expected_next_month_title()}
          description={m.stats_expected_next_month_description()}
          value={stats.expectedNextMonth.value}
          isLoading={isLoading}
          userBaseCurrency={userBaseCurrency}
          breakdown={stats.expectedNextMonth.breakdown}
        />
      </div>
    </div>
  );
}

const StatsCard = ({
  title,
  description,
  value,
  isLoading,
  userBaseCurrency,
  breakdown,
}: {
  title: string;
  description?: string;
  value: number;
  isLoading: boolean;
  userBaseCurrency: string;
  breakdown?: BreakdownItem[];
}) => {
  const currencySymbol = currencyToSymbol(userBaseCurrency);
  return (
    <Card className="py-5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="font-normal text-lg md:text-xl">
          {title}
        </CardTitle>
        {description && (
          <Popover>
            <PopoverTrigger className="mb-auto">
              <InfoIcon size={20} className="text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent
              className="w-max max-w-80 gap-0 px-3 py-3"
              side="top"
            >
              <p className="text-sm">{description}</p>
              {breakdown && breakdown.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 border-t pt-2">
                  {breakdown.map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          width={28}
                          height={20}
                          className="max-h-5 w-auto max-w-7 object-contain"
                        />
                      ) : (
                        <div className="h-5 w-7 shrink-0" />
                      )}
                      <span className="grow text-sm">{item.name}</span>
                      <span className="font-medium text-sm tabular-nums">
                        {item.retainPrice.toLocaleString()}
                        {currencySymbol}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PopoverContent>
          </Popover>
        )}
      </CardHeader>
      <CardContent className="flex items-center font-bold text-2xl">
        {isLoading ? <Skeleton className="mr-1 h-6 w-1/4" /> : rounded(value)}
        {currencyToSymbol(userBaseCurrency)}
      </CardContent>
    </Card>
  );
};

const MonthlyStatsCard = ({
  title,
  subscriptions,
  isLoading,
  userBaseCurrency,
  categoriesFillColor,
  filters,
}: {
  title: string;
  subscriptions: SubscriptionItem[];
  isLoading: boolean;
  userBaseCurrency: string;
  categoriesFillColor: Record<string, ChartFillColor>;
  filters: { users: string | null };
}) => {
  const totalMonthlySub = rounded(
    subscriptions.reduce(
      (acc, subscription) =>
        filters.users
          ? acc + subscription.price / subscription.users.length
          : acc + subscription.price,
      0,
    ),
  );
  const chartData = subscriptions
    .map((subscription) => ({
      price: subscription.price,
      category: subscription.category.name,
      usersLength: subscription.users.length,
    }))
    .reduce(
      (acc, subscription) => {
        const cat = acc.find((cat) => cat.category === subscription.category);
        const subPrice = filters.users
          ? subscription.price / subscription.usersLength
          : subscription.price;
        if (cat) {
          cat.price += subPrice;
        } else {
          acc.push({ category: subscription.category, price: subPrice });
        }
        return acc;
      },
      [] as Array<{ category: string; price: number; fill?: ChartFillColor }>,
    )
    .sort((a, b) => b.category.localeCompare(a.category))
    .map((x, i) => ({
      ...x,
      price: rounded(x.price),
      fill: categoriesFillColor[x.category] ?? `var(--chart-${(i + 1) % 5})`,
    }));
  const chartConfig = Array.from(
    new Set(subscriptions.map((s) => s.category.name)),
  ).reduce((acc, category) => {
    acc[category] = { label: category };
    return acc;
  }, {} as ChartConfig);

  if (isLoading) {
    return (
      <Card className="flex flex-col md:row-span-2 py-3">
        <CardHeader className="items-center pb-0">
          <CardTitle className="font-normal text-lg md:text-xl">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <div className="mx-auto flex aspect-square max-h-62.5 items-center justify-center">
            <Skeleton className="h-10 w-24" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card className="flex flex-col md:row-span-2 py-3">
      <CardHeader className="items-center">
        <CardTitle className="font-normal text-lg md:text-xl">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-60"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  valueFormatter={(value) =>
                    value.toLocaleString() +
                    CURRENCY_SYMBOLS[
                      userBaseCurrency as keyof typeof CURRENCY_SYMBOLS
                    ]
                  }
                />
              }
            />
            <Pie
              data={chartData}
              dataKey="price"
              nameKey="category"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground font-bold text-3xl"
                        >
                          {totalMonthlySub.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy ?? 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {userBaseCurrency}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
