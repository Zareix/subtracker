import { useNavigate, useSearch } from "@tanstack/react-router";
import type { Sort } from "~/lib/constant";

export const useSort = () => {
  const search = useSearch({ from: "/_private" });
  const navigate = useNavigate();

  const sort: Sort = (search.sort as Sort) ?? "NEXT_PAYMENT_DATE";

  const setSort = (value: Sort | null) => {
    navigate({ search: (prev) => ({ ...prev, sort: value ?? undefined }) });
  };

  return [sort, setSort] as const;
};
