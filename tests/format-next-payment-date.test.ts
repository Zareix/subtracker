import { beforeEach, describe, expect, it, setSystemTime } from "bun:test"

import { endOfDay } from "date-fns"

import { formatNextPaymentDate } from "~/lib/utils"

const date = (year: number, monthIndex: number, day: number) => new Date(year, monthIndex, day)

describe("formatNextPaymentDate", () => {
  // Fixed "today": July 14, 2026, 12:00
  beforeEach(() => {
    setSystemTime(new Date(2026, 6, 14, 12, 0))
  })

  it("returns the relative label without date prefix when the payment is today", () => {
    // NOTE: the current implementation leaves a leading space when there is no
    // date prefix — documented here as-is.
    expect(formatNextPaymentDate(endOfDay(date(2026, 6, 14)))).toBe(" Today at 11:59 PM")
  })

  it("prefixes tomorrow's relative label with the date", () => {
    expect(formatNextPaymentDate(endOfDay(date(2026, 6, 15)))).toBe("15/07 - Tomorrow at 11:59 PM")
  })

  it("returns the relative label without date prefix for yesterday's end of day", () => {
    // differenceInDays truncates yesterday's endOfDay toward zero, so it counts
    // as "today" (no prefix) while formatRelative still says "yesterday".
    expect(formatNextPaymentDate(endOfDay(date(2026, 6, 13)))).toBe(" Yesterday at 11:59 PM")
  })

  it("uses the relative format with a date prefix within a few days", () => {
    expect(formatNextPaymentDate(endOfDay(date(2026, 6, 8)))).toBe(
      "08/07 - Last Wednesday at 11:59 PM",
    )
  })

  it("switches to a plain dd/MM date from 6 days away, same year", () => {
    expect(formatNextPaymentDate(endOfDay(date(2026, 6, 20)))).toBe("20/07")
    expect(formatNextPaymentDate(endOfDay(date(2026, 6, 7)))).toBe("07/07")
    expect(formatNextPaymentDate(endOfDay(date(2026, 11, 25)))).toBe("25/12")
  })

  it("includes the year when the payment is in another year", () => {
    expect(formatNextPaymentDate(endOfDay(date(2027, 0, 10)))).toBe("10/01/2027")
    expect(formatNextPaymentDate(endOfDay(date(2025, 11, 20)))).toBe("20/12/2025")
  })
})
