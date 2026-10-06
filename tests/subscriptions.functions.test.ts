import { describe, expect, it, setSystemTime } from "bun:test"

import { endOfDay } from "date-fns"

import {
  calculateNextPaymentDate,
  calculatePreviousPaymentDate,
  calculateSecondNextPaymentDate,
  convertToDefaultCurrency,
} from "~/functions/subscriptions.functions"
import type { Schedule } from "~/lib/constant"
import { SCHEDULES } from "~/lib/constant"
import type { ExchangeRate } from "~/lib/db/schema"

// Local-time constructors, matching the semantics of the functions under test.
const date = (year: number, monthIndex: number, day: number, hours = 0, minutes = 0) =>
  new Date(year, monthIndex, day, hours, minutes)

const now = (year: number, monthIndex: number, day: number, hours = 0, minutes = 0) =>
  setSystemTime(date(year, monthIndex, day, hours, minutes))

// Every function under test returns dates normalized with `endOfDay`.
const expectEndOfDay = (received: Date, expected: Date) => {
  expect(received.toISOString()).toBe(endOfDay(expected).toISOString())
}

describe("calculateNextPaymentDate", () => {
  describe("first payment in the future", () => {
    for (const schedule of SCHEDULES) {
      it(`returns the first payment date as-is for a ${schedule} subscription`, () => {
        now(2026, 9, 6) // October 6, 2026
        const firstPaymentDate = date(2026, 11, 25) // December 25, 2026

        expectEndOfDay(calculateNextPaymentDate(schedule, firstPaymentDate), firstPaymentDate)
      })
    }
  })

  describe("Monthly", () => {
    const firstPaymentDate = date(2026, 0, 15) // January 15, 2026
    const schedule: Schedule = "Monthly"

    it("returns the payment day of the current month when it has not passed yet", () => {
      now(2026, 8, 6) // September 6, 2026

      expectEndOfDay(calculateNextPaymentDate(schedule, firstPaymentDate), date(2026, 8, 15))
    })

    it("returns today when it is the payment day (even mid-day)", () => {
      now(2026, 8, 15, 14, 30) // September 15, 2026, 14:30

      expectEndOfDay(calculateNextPaymentDate(schedule, firstPaymentDate), date(2026, 8, 15))
    })

    it("rolls over to next month when the payment day has passed", () => {
      now(2026, 8, 20) // September 20, 2026

      expectEndOfDay(calculateNextPaymentDate(schedule, firstPaymentDate), date(2026, 9, 15))
    })
  })

  describe("Quarterly", () => {
    const firstPaymentDate = date(2026, 1, 2) // February 2, 2026
    const schedule: Schedule = "Quarterly"

    // Regression: the next payment used to be anchored on the current month
    // (like a Monthly subscription) instead of on the payment anniversaries
    // (Feb -> May -> Aug -> Nov).
    it("skips to the next anniversary month when the current month is not one", () => {
      now(2026, 9, 6) // October 6, 2026 — not an anniversary month

      expectEndOfDay(calculateNextPaymentDate(schedule, firstPaymentDate), date(2026, 10, 2))
    })

    it("returns the payment day of the current month when it is an anniversary month", () => {
      now(2026, 7, 1) // August 1, 2026

      expectEndOfDay(calculateNextPaymentDate(schedule, firstPaymentDate), date(2026, 7, 2))
    })

    it("returns today when it is the payment day", () => {
      now(2026, 10, 2, 10, 0) // November 2, 2026, 10:00

      expectEndOfDay(calculateNextPaymentDate(schedule, firstPaymentDate), date(2026, 10, 2))
    })

    it("skips to the next anniversary month when the anniversary day has passed", () => {
      now(2026, 7, 5) // August 5, 2026

      expectEndOfDay(calculateNextPaymentDate(schedule, firstPaymentDate), date(2026, 10, 2))
    })
  })

  describe("Semiannual", () => {
    const firstPaymentDate = date(2026, 0, 15) // January 15, 2026
    const schedule: Schedule = "Semiannual"

    // Regression: the reported bug — the next payment used to be anchored on
    // the current month (like a Monthly subscription) instead of on the
    // payment anniversaries (Jan -> Jul).
    it("skips to the next anniversary month when the current month is not one", () => {
      now(2026, 9, 6) // October 6, 2026 — the 15th has not passed yet, but October is not an anniversary month

      expectEndOfDay(calculateNextPaymentDate(schedule, firstPaymentDate), date(2027, 0, 15))
    })

    it("returns the payment day of the current month when it is an anniversary month", () => {
      now(2026, 6, 14) // July 14, 2026

      expectEndOfDay(calculateNextPaymentDate(schedule, firstPaymentDate), date(2026, 6, 15))
    })

    it("returns today when it is the payment day (even mid-day)", () => {
      now(2026, 6, 15, 14, 30) // July 15, 2026, 14:30

      expectEndOfDay(calculateNextPaymentDate(schedule, firstPaymentDate), date(2026, 6, 15))
    })

    it("skips to the next anniversary when the anniversary day has passed", () => {
      now(2026, 6, 16) // July 16, 2026

      expectEndOfDay(calculateNextPaymentDate(schedule, firstPaymentDate), date(2027, 0, 15))
    })

    it("computes the next anniversary across multiple years", () => {
      now(2026, 9, 6) // October 6, 2026
      // March 10, 2024 — anniversaries: Sep 10 2026 passed, next Mar 10 2027
      const firstPaymentMarch2024 = date(2024, 2, 10)

      expectEndOfDay(calculateNextPaymentDate(schedule, firstPaymentMarch2024), date(2027, 2, 10))
    })

    it("clamps to the end of the month when the payment day overflows (addMonths)", () => {
      now(2026, 9, 6) // October 6, 2026
      // August 31, 2026 — +6 months clamps to February 28, 2027
      const firstPaymentAugust31 = date(2026, 7, 31)

      expectEndOfDay(calculateNextPaymentDate(schedule, firstPaymentAugust31), date(2027, 1, 28))
    })
  })

  describe("Yearly", () => {
    const firstPaymentDate = date(2025, 2, 15) // March 15, 2025
    const schedule: Schedule = "Yearly"

    it("returns the anniversary later this year when it has not passed yet", () => {
      now(2026, 0, 10) // January 10, 2026

      expectEndOfDay(calculateNextPaymentDate(schedule, firstPaymentDate), date(2026, 2, 15))
    })

    it("returns today when it is the payment day", () => {
      now(2026, 2, 15, 9, 0) // March 15, 2026, 09:00

      expectEndOfDay(calculateNextPaymentDate(schedule, firstPaymentDate), date(2026, 2, 15))
    })

    it("rolls over to next year when the anniversary has passed", () => {
      now(2026, 9, 6) // October 6, 2026

      expectEndOfDay(calculateNextPaymentDate(schedule, firstPaymentDate), date(2027, 2, 15))
    })
  })
})

describe("calculateSecondNextPaymentDate", () => {
  it("adds one month for a Monthly subscription", () => {
    expectEndOfDay(
      calculateSecondNextPaymentDate("Monthly", endOfDay(date(2026, 8, 15))),
      date(2026, 9, 15),
    )
  })

  it("adds three months for a Quarterly subscription", () => {
    expectEndOfDay(
      calculateSecondNextPaymentDate("Quarterly", endOfDay(date(2026, 10, 2))),
      date(2027, 1, 2),
    )
  })

  it("adds six months for a Semiannual subscription", () => {
    expectEndOfDay(
      calculateSecondNextPaymentDate("Semiannual", endOfDay(date(2027, 0, 15))),
      date(2027, 6, 15),
    )
  })

  it("adds one year for a Yearly subscription", () => {
    expectEndOfDay(
      calculateSecondNextPaymentDate("Yearly", endOfDay(date(2027, 2, 15))),
      date(2028, 2, 15),
    )
  })

  it("clamps to the end of the month when the payment day overflows", () => {
    // February 28, 2027 + 6 months clamps to August 28, 2027
    expectEndOfDay(
      calculateSecondNextPaymentDate("Semiannual", endOfDay(date(2027, 1, 28))),
      date(2027, 7, 28),
    )
  })
})

describe("calculatePreviousPaymentDate", () => {
  it("subtracts one month for a Monthly subscription", () => {
    expectEndOfDay(
      calculatePreviousPaymentDate("Monthly", date(2026, 0, 15), endOfDay(date(2026, 8, 15))),
      date(2026, 7, 15),
    )
  })

  it("subtracts three months for a Quarterly subscription", () => {
    expectEndOfDay(
      calculatePreviousPaymentDate("Quarterly", date(2026, 1, 2), endOfDay(date(2026, 10, 2))),
      date(2026, 7, 2),
    )
  })

  it("subtracts six months for a Semiannual subscription", () => {
    expectEndOfDay(
      calculatePreviousPaymentDate("Semiannual", date(2026, 0, 15), endOfDay(date(2027, 0, 15))),
      date(2026, 6, 15),
    )
  })

  it("subtracts one year for a Yearly subscription", () => {
    expectEndOfDay(
      calculatePreviousPaymentDate("Yearly", date(2025, 2, 15), endOfDay(date(2026, 2, 15))),
      date(2025, 2, 15),
    )
  })

  it("returns the first payment date when the previous payment falls before it", () => {
    // The first payment is still ahead: previous would be 6 months before it.
    expectEndOfDay(
      calculatePreviousPaymentDate("Semiannual", date(2026, 0, 15), endOfDay(date(2026, 0, 15))),
      date(2026, 0, 15),
    )
  })

  it("returns the first payment date when the previous payment is exactly it", () => {
    // Feb 2 -> May 2 is the first full cycle: previous is the first payment.
    expectEndOfDay(
      calculatePreviousPaymentDate("Quarterly", date(2026, 1, 2), endOfDay(date(2026, 4, 2))),
      date(2026, 1, 2),
    )
  })
})

describe("convertToDefaultCurrency", () => {
  const rates: Array<ExchangeRate> = [
    { baseCurrency: "USD", targetCurrency: "EUR", rate: 0.9 },
    { baseCurrency: "GBP", targetCurrency: "USD", rate: 1.25 },
  ]

  it("returns the price unchanged when the subscription currency is the base currency", () => {
    expect(convertToDefaultCurrency(rates, 10, "EUR", "EUR")).toBe(10)
  })

  it("converts the price using the matching exchange rate", () => {
    expect(convertToDefaultCurrency(rates, 10, "USD", "EUR")).toBe(9)
    expect(convertToDefaultCurrency(rates, 8, "GBP", "USD")).toBe(10)
  })

  it("returns the price unchanged when no exchange rate matches the pair", () => {
    expect(convertToDefaultCurrency(rates, 10, "GBP", "EUR")).toBe(10)
    expect(convertToDefaultCurrency([], 10, "USD", "EUR")).toBe(10)
  })
})
