import { useNavigate, useSearch } from "@tanstack/react-router"

import type { Sort } from "~/lib/constant"

export const useSort = () => {
  const search = useSearch({ from: "/_private" })
  const navigate = useNavigate({ from: "/" })

  const setSort = (value: Sort | null) => {
    navigate({ search: (prev) => ({ ...prev, sort: value ?? "NEXT_PAYMENT_DATE" }) })
  }

  return [search.sort ?? "NEXT_PAYMENT_DATE", setSort] as const
}
