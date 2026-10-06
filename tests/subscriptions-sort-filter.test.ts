import { describe, expect, it } from "bun:test"

import type { Filters } from "~/lib/hooks/use-filters"
import { getFilteredSubscriptions, getSortedSubscriptions } from "~/lib/utils"

type SortableSubscription = Parameters<typeof getSortedSubscriptions>[0][number]
type FilterableSubscription = Parameters<typeof getFilteredSubscriptions>[0][number]

const date = (year: number, monthIndex: number, day: number) => new Date(year, monthIndex, day)

const noFilters: Filters = {
  schedule: null,
  paymentMethods: [],
  users: null,
  categories: [],
  search: "",
}

describe("getSortedSubscriptions", () => {
  const alpha: SortableSubscription = {
    name: "Alpha",
    price: 10,
    nextPaymentDate: date(2026, 9, 15), // Oct 15
  }
  const beta: SortableSubscription = {
    name: "Beta",
    price: 5,
    nextPaymentDate: date(2026, 10, 20), // Nov 20
  }
  const mid: SortableSubscription = {
    name: "Mid",
    price: 30,
    nextPaymentDate: date(2026, 11, 1), // Dec 1
  }
  const zulu: SortableSubscription = {
    name: "Zulu",
    price: 10,
    nextPaymentDate: date(2027, 0, 1), // Jan 1 2027
  }

  it("sorts alphabetically by name when no sort is given", () => {
    const sorted = getSortedSubscriptions([zulu, mid, alpha, beta], null)

    expect(sorted.map((s) => s.name)).toEqual(["Alpha", "Beta", "Mid", "Zulu"])
  })

  it("sorts by ascending price, ties keep the alphabetical order", () => {
    const sorted = getSortedSubscriptions([zulu, mid, alpha, beta], "PRICE_ASC")

    // Alpha and Zulu both cost 10: alphabetical order is preserved
    expect(sorted.map((s) => s.name)).toEqual(["Beta", "Alpha", "Zulu", "Mid"])
  })

  it("sorts by descending price, ties keep the alphabetical order", () => {
    const sorted = getSortedSubscriptions([zulu, mid, alpha, beta], "PRICE_DESC")

    expect(sorted.map((s) => s.name)).toEqual(["Mid", "Alpha", "Zulu", "Beta"])
  })

  it("sorts by next payment date, ties keep the alphabetical order", () => {
    const zebra: SortableSubscription = {
      name: "Zebra",
      price: 50,
      nextPaymentDate: date(2026, 11, 1), // Dec 1, same day as Mid
    }
    const sorted = getSortedSubscriptions([zulu, zebra, mid, alpha, beta], "NEXT_PAYMENT_DATE")

    // Mid and Zebra are due the same day: alphabetical order is preserved
    expect(sorted.map((s) => s.name)).toEqual(["Alpha", "Beta", "Mid", "Zebra", "Zulu"])
  })
})

describe("getFilteredSubscriptions", () => {
  const netflix: FilterableSubscription = {
    name: "Netflix",
    description: "Video streaming service",
    schedule: "Monthly",
    users: [{ id: "u1" }, { id: "u2" }],
    paymentMethod: { id: 1 },
    category: { id: 1 },
  }
  const spotify: FilterableSubscription = {
    name: "Spotify",
    description: "Music streaming service",
    schedule: "Quarterly",
    users: [{ id: "u1" }],
    paymentMethod: { id: 2 },
    category: { id: 1 },
  }
  const ovh: FilterableSubscription = {
    name: "OVH domain",
    description: "Domain name renewal",
    schedule: "Yearly",
    users: [{ id: "u2" }],
    paymentMethod: { id: 3 },
    category: { id: 2 },
  }
  const subscriptions = [netflix, spotify, ovh]

  it("returns everything when no filter is set", () => {
    const filtered = getFilteredSubscriptions(subscriptions, noFilters)

    expect(filtered.map((s) => s.name)).toEqual(["Netflix", "Spotify", "OVH domain"])
  })

  it("filters by schedule", () => {
    const filtered = getFilteredSubscriptions(subscriptions, {
      ...noFilters,
      schedule: "Quarterly",
    })

    expect(filtered.map((s) => s.name)).toEqual(["Spotify"])
  })

  it("filters by any of the selected payment methods", () => {
    const filtered = getFilteredSubscriptions(subscriptions, {
      ...noFilters,
      paymentMethods: [1, 3],
    })

    expect(filtered.map((s) => s.name)).toEqual(["Netflix", "OVH domain"])
  })

  it("filters by payer", () => {
    const filtered = getFilteredSubscriptions(subscriptions, { ...noFilters, users: "u2" })

    expect(filtered.map((s) => s.name)).toEqual(["Netflix", "OVH domain"])
  })

  it("filters by any of the selected categories", () => {
    const filtered = getFilteredSubscriptions(subscriptions, { ...noFilters, categories: [2] })

    expect(filtered.map((s) => s.name)).toEqual(["OVH domain"])
  })

  it("searches case-insensitively in the name", () => {
    const filtered = getFilteredSubscriptions(subscriptions, { ...noFilters, search: "NETFLIX" })

    expect(filtered.map((s) => s.name)).toEqual(["Netflix"])
  })

  it("searches in the description", () => {
    const filtered = getFilteredSubscriptions(subscriptions, { ...noFilters, search: "music" })

    expect(filtered.map((s) => s.name)).toEqual(["Spotify"])
  })

  it("returns nothing when the search matches no subscription", () => {
    const filtered = getFilteredSubscriptions(subscriptions, { ...noFilters, search: "insurance" })

    expect(filtered).toEqual([])
  })

  it("combines filters (intersection)", () => {
    const filtered = getFilteredSubscriptions(subscriptions, {
      ...noFilters,
      schedule: "Monthly",
      categories: [2],
    })

    expect(filtered).toEqual([])
  })
})
