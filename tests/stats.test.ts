import { beforeEach, describe, expect, it, setSystemTime } from "bun:test"

import { endOfDay } from "date-fns"

import type { SubscriptionItem } from "~/functions/subscriptions.functions"
import type { Schedule } from "~/lib/constant"
import type { User } from "~/lib/db/schema"
import { getStats } from "~/lib/stats"

const date = (year: number, monthIndex: number, day: number) => new Date(year, monthIndex, day)

const makeUser = (id: string): User => ({
  id,
  name: `User ${id}`,
  email: `${id}@example.com`,
  emailVerified: true,
  role: "user",
  image: null,
  baseCurrency: "EUR",
  createdAt: date(2026, 0, 1),
  updatedAt: date(2026, 0, 1),
  banned: false,
  banReason: null,
  banExpires: null,
})

const alice = makeUser("alice")
const bob = makeUser("bob")

const makeSubscription = (
  overrides: Partial<SubscriptionItem> & Pick<SubscriptionItem, "schedule" | "price">,
): SubscriptionItem => ({
  id: 1,
  name: "Subscription",
  description: "",
  image: null,
  currency: "EUR",
  firstPaymentDate: date(2026, 0, 1),
  createdAt: date(2026, 0, 1),
  updatedAt: null,
  url: null,
  originalPrice: 0,
  paymentMethod: { id: 1, name: "Card", image: null },
  category: { id: 1, name: "Category", icon: null },
  users: [alice],
  nextPaymentDate: date(2026, 9, 15),
  secondNextPaymentDate: date(2026, 10, 15),
  previousPaymentDate: date(2026, 8, 15),
  ...overrides,
})

// Fixed "today": October 6, 2026, 12:00
beforeEach(() => {
  setSystemTime(new Date(2026, 9, 6, 12, 0))
})

describe("getStats", () => {
  // Netflix: 15/month — next payment Oct 15, second Nov 15, previous Sep 15
  // Spotify: 33/quarter — next payment Jan 2 2027, second Apr 2 2027, previous Oct 2
  // iCloud: 60/6 months — next payment Nov 20, second May 20 2027, previous May 20
  // OVH domain: 120/year — next payment Sep 10 2027, second Sep 10 2028, previous Sep 10
  const netflix = makeSubscription({
    id: 1,
    name: "Netflix",
    schedule: "Monthly",
    price: 15,
    users: [alice],
    nextPaymentDate: date(2026, 9, 15),
    secondNextPaymentDate: date(2026, 10, 15),
    previousPaymentDate: date(2026, 8, 15),
  })
  const spotify = makeSubscription({
    id: 2,
    name: "Spotify",
    schedule: "Quarterly",
    price: 33,
    users: [alice, bob],
    nextPaymentDate: date(2027, 0, 2),
    secondNextPaymentDate: date(2027, 3, 2),
    previousPaymentDate: date(2026, 9, 2),
  })
  const icloud = makeSubscription({
    id: 3,
    name: "iCloud",
    schedule: "Semiannual",
    price: 60,
    users: [alice],
    nextPaymentDate: date(2026, 10, 20),
    secondNextPaymentDate: date(2027, 4, 20),
    previousPaymentDate: date(2026, 4, 20),
  })
  const ovh = makeSubscription({
    id: 4,
    name: "OVH domain",
    schedule: "Yearly",
    price: 120,
    users: [alice, bob],
    nextPaymentDate: date(2027, 8, 10),
    secondNextPaymentDate: date(2028, 8, 10),
    previousPaymentDate: date(2026, 8, 10),
  })
  const subscriptions = [netflix, spotify, icloud, ovh]

  it("smooths monthly and yearly totals according to the schedule", () => {
    const stats = getStats(subscriptions, { users: null })

    // Monthly: 15 + 33/3 + 60/6 + 120/12 = 15 + 11 + 10 + 10
    expect(stats.totalPerMonth.value).toBe(46)
    // Yearly: 180 + 132 + 120 + 120
    expect(stats.totalPerYear.value).toBe(552)

    expect(stats.totalPerMonth.breakdown.find((s) => s.id === 1)?.retainPrice).toBe(15)
    expect(stats.totalPerMonth.breakdown.find((s) => s.id === 2)?.retainPrice).toBe(11)
    expect(stats.totalPerMonth.breakdown.find((s) => s.id === 3)?.retainPrice).toBe(10)
    expect(stats.totalPerMonth.breakdown.find((s) => s.id === 4)?.retainPrice).toBe(10)
  })

  it("counts this month's payments from the next OR previous payment date", () => {
    const stats = getStats(subscriptions, { users: null })

    // Netflix (next Oct 15) + Spotify (previous Oct 2, next is in January)
    expect(stats.totalThisMonth.value).toBe(15 + 33)
    expect(stats.totalThisMonth.breakdown.map((s) => s.id).sort((a, b) => a - b)).toEqual([1, 2])
  })

  it("counts only upcoming payments before the end of the month", () => {
    const stats = getStats(subscriptions, { users: null })

    // Only Netflix has a next payment before the end of October
    expect(stats.remainingThisMonth.value).toBe(15)
    expect(stats.remainingThisMonth.breakdown.map((s) => s.id)).toEqual([1])
  })

  it("includes a payment due on the 30th but excludes one on the last day of the month", () => {
    // NOTE: `isBefore(nextPaymentDate, endOfMonth(now))` is strict, and both dates are
    // endOfDay instants: a payment on October 31 is NOT counted as remaining this month.
    const dueOn30th = makeSubscription({
      id: 10,
      schedule: "Monthly" as Schedule,
      price: 20,
      nextPaymentDate: endOfDay(date(2026, 9, 30)),
    })
    const dueOn31st = makeSubscription({
      id: 11,
      schedule: "Monthly" as Schedule,
      price: 40,
      nextPaymentDate: endOfDay(date(2026, 9, 31)),
    })

    const stats = getStats([dueOn30th, dueOn31st], { users: null })

    expect(stats.remainingThisMonth.value).toBe(20)
    expect(stats.remainingThisMonth.breakdown.map((s) => s.id)).toEqual([10])
  })

  it("expects next month's payments from the next OR second next payment date", () => {
    const stats = getStats(subscriptions, { users: null })

    // Netflix (second next Nov 15) + iCloud (next Nov 20)
    expect(stats.expectedNextMonth.value).toBe(15 + 60)
    expect(stats.expectedNextMonth.breakdown.map((s) => s.id).sort((a, b) => a - b)).toEqual([1, 3])
  })

  it("splits prices between payers when a user filter is set", () => {
    const stats = getStats(subscriptions, { users: "alice" })

    // Netflix 15 + Spotify (33/2)x(1/3) + iCloud (60/1)x(1/6) + OVH (120/2)x(1/12)
    // = 15 + 5.5 + 10 + 5
    expect(stats.totalPerMonth.value).toBe(35.5)
    expect(stats.totalPerMonth.breakdown.find((s) => s.id === 2)?.retainPrice).toBe(5.5)
    expect(stats.totalPerMonth.breakdown.find((s) => s.id === 4)?.retainPrice).toBe(5)
  })

  it("returns zeroed totals for an empty subscription list", () => {
    const stats = getStats([], { users: null })

    expect(stats.totalPerMonth.value).toBe(0)
    expect(stats.totalPerYear.value).toBe(0)
    expect(stats.totalThisMonth.value).toBe(0)
    expect(stats.remainingThisMonth.value).toBe(0)
    expect(stats.expectedNextMonth.value).toBe(0)
  })
})
