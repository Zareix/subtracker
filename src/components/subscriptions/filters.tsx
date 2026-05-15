import { useQuery } from "@tanstack/react-query";
import { FilterIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import { getCategories } from "~/functions/categories.functions";
import { getPaymentMethods } from "~/functions/payment-methods.functions";
import { getUsers } from "~/functions/users.functions";
import { SCHEDULES, type Schedule } from "~/lib/constant";
import { type Filters, useFilters } from "~/lib/hooks/use-filters";
import { cn } from "~/lib/utils";
import { m } from "~/paraglide/messages";

const SCHEDULE_LABELS: Record<Schedule, () => string> = {
  Monthly: m.schedule_monthly,
  Quarterly: m.schedule_quarterly,
  Semiannual: m.schedule_semiannual,
  Yearly: m.schedule_yearly,
};

type Props = {
  filtersDisplayed?: Array<keyof Filters>;
};

export const FiltersButton = ({
  filtersDisplayed = ["paymentMethods", "schedule", "users", "categories"],
}: Props) => {
  const [filters, setFilters] = useFilters();
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
  });
  const paymentMethodsQuery = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: () => getPaymentMethods(),
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  if (
    usersQuery.isError ||
    paymentMethodsQuery.isError ||
    categoriesQuery.isError
  ) {
    return null;
  }

  const paymentMethods = paymentMethodsQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const categories = categoriesQuery.data ?? [];

  const hasActiveFilters =
    !!filters.schedule ||
    !!filters.users ||
    filters.paymentMethods.length > 0 ||
    filters.categories.length > 0;

  return (
    <div className="flex items-center gap-4">
      <Popover>
        <PopoverTrigger
          render={
            <Button
              size="icon"
              variant="ghost"
              disabled={
                usersQuery.isLoading ||
                paymentMethodsQuery.isLoading ||
                categoriesQuery.isLoading
              }
            >
              <FilterIcon
                size={24}
                className={cn(
                  hasActiveFilters
                    ? "fill-primary text-primary"
                    : "text-foreground",
                )}
              />
            </Button>
          }
        />
        <PopoverContent className="mr-3 w-fit min-w-50 gap-0 p-1">
          <PopoverHeader className="gap-0">
            <PopoverTitle className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
              {m.filters_label()}
            </PopoverTitle>
            <Separator className="my-1 -ml-1 w-[calc(100%+0.5rem)]" />
          </PopoverHeader>
          <div className="flex flex-col gap-2 p-2 pt-0">
            {filtersDisplayed.includes("users") && (
              <>
                <Label htmlFor="filters-users" className="mt-2">
                  {m.filters_users()}
                </Label>
                <Select
                  id="filters-users"
                  onValueChange={(value) =>
                    setFilters({
                      users: filters.users === value ? null : value,
                    })
                  }
                  value={filters.users ?? ""}
                  items={users.map((u) => ({ value: u.id, label: u.name }))}
                >
                  <SelectTrigger className="w-full capitalize">
                    <SelectValue placeholder={m.filters_select()} />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem value={user.id} key={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            {filtersDisplayed.includes("schedule") && (
              <>
                <Label htmlFor="filters-schedule" className="mt-2">
                  {m.filters_schedule()}
                </Label>
                <Select
                  id="filters-schedule"
                  onValueChange={(value) =>
                    setFilters({
                      schedule:
                        filters.schedule === value ? null : (value as Schedule),
                    })
                  }
                  value={filters.schedule ?? ""}
                  items={SCHEDULES.map((s) => ({
                    value: s,
                    label: SCHEDULE_LABELS[s](),
                  }))}
                >
                  <SelectTrigger className="w-full capitalize">
                    <SelectValue placeholder={m.filters_select()} />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULES.map((schedule) => (
                      <SelectItem value={schedule} key={schedule}>
                        {SCHEDULE_LABELS[schedule]()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            {filtersDisplayed.includes("paymentMethods") && (
              <>
                <Label htmlFor="filters-paymentMethods" className="mt-2">
                  {m.filters_payment_methods()}
                </Label>
                <Select
                  id="filters-paymentMethods"
                  onValueChange={(value) =>
                    setFilters({
                      paymentMethods:
                        value.length === 0
                          ? undefined
                          : value.map((v) => Number.parseInt(v, 10)),
                    })
                  }
                  value={filters.paymentMethods.map((pm) => pm.toString())}
                  multiple
                  items={paymentMethods.map((pm) => ({
                    value: pm.id.toString(),
                    label: pm.name,
                  }))}
                >
                  <SelectTrigger className="w-full capitalize">
                    <SelectValue placeholder={m.filters_select()} />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((pm) => (
                      <SelectItem value={pm.id.toString()} key={pm.id}>
                        {pm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
            {filtersDisplayed.includes("categories") && (
              <>
                <Label htmlFor="filters-categories" className="mt-2">
                  {m.filters_categories()}
                </Label>
                <Select
                  id="filters-categories"
                  onValueChange={(value) =>
                    setFilters({
                      categories:
                        value.length === 0
                          ? undefined
                          : value.map((v) => Number.parseInt(v, 10)),
                    })
                  }
                  value={filters.categories.map((c) => c.toString())}
                  multiple
                  items={categories.map((cat) => ({
                    value: cat.id.toString(),
                    label: cat.name,
                  }))}
                >
                  <SelectTrigger className="w-full capitalize">
                    <SelectValue placeholder={m.filters_select()} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem value={cat.id.toString()} key={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
