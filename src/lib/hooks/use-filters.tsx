import { useNavigate, useSearch } from "@tanstack/react-router";
import { SCHEDULES, type Schedule } from "~/lib/constant";

export const useFilters = () => {
  const search = useSearch({ from: "/_private" });
  const navigate = useNavigate();

  const filters = {
    schedule: search.schedule ?? null,
    paymentMethods: search.paymentMethods ?? [],
    users: search.users ?? null,
    categories: search.categories ?? [],
    search: search.search ?? "",
  };

  const setFilters = (next: Partial<typeof filters>) => {
    navigate({
      search: (prev) => ({
        ...prev,
        ...next,
        schedule:
          next.schedule !== undefined
            ? (next.schedule ?? undefined)
            : prev.schedule,
        users:
          next.users !== undefined ? (next.users ?? undefined) : prev.users,
      }),
    });
  };

  return [filters, setFilters] as const;
};

export type Filters = ReturnType<typeof useFilters>[0];
