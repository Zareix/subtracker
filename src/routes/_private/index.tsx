import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Calendar1Icon } from "lucide-react";
import { CreateSubscriptionDialog } from "~/components/subscriptions/create";
import { FiltersButton } from "~/components/subscriptions/filters";
import { SubscriptionList } from "~/components/subscriptions/list";
import { SearchBar } from "~/components/subscriptions/search-bar";
import { SortButton } from "~/components/subscriptions/sort";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";
import { getSubscriptions } from "~/functions/subscriptions.functions";
import { m } from "~/paraglide/messages";

export const Route = createFileRoute("/_private/")({ component: HomePage });

const LoadingSkeleton = () => (
  <Card className="mt-3 border-none from-card opacity-50 shadow-none ring-transparent">
    <CardContent>
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-14" />
        <div className="flex grow flex-col gap-1">
          <Skeleton className="h-6 w-20 md:w-28" />
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <Calendar1Icon size={16} />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-12" />
      </div>
    </CardContent>
  </Card>
);

function HomePage() {
  const subscriptionsQuery = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => getSubscriptions(),
  });

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-y-1">
        <h1 className="font-bold text-3xl">{m.home_title()}</h1>
        <div className="flex items-center gap-2">
          <CreateSubscriptionDialog
            trigger={
              <Button className="hidden md:block">
                {m.home_add_subscription()}
              </Button>
            }
          />
          <SearchBar />
          <FiltersButton />
          <SortButton />
        </div>
      </header>
      <div className="mt-2 grid">
        {subscriptionsQuery.isLoading ? (
          <LoadingSkeleton />
        ) : (
          <SubscriptionList subscriptions={subscriptionsQuery.data ?? []} />
        )}
      </div>
    </>
  );
}
