import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { addMonths, isBefore, isSameDay, subMonths } from "date-fns"
import { useState } from "react"

import { Calendar, CalendarDayButton } from "~/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover"
import { getSubscriptions } from "~/functions/subscriptions.functions"
import { authClient } from "~/lib/auth-client"
import { cn, formatPrice } from "~/lib/utils"
import { m } from "~/paraglide/messages"

export const Route = createFileRoute("/_private/calendar")({
  component: CalendarPage,
})

function CalendarPage() {
  const session = authClient.useSession()
  const subscriptionsQuery = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => getSubscriptions(),
  })

  const userCurrency = session.data?.user.baseCurrency ?? "EUR"

  return (
    <>
      <header className="mb-2">
        <h1 className="text-3xl font-bold">{m.calendar_title()}</h1>
      </header>
      {subscriptionsQuery.isLoading ? (
        <Calendar
          mode="single"
          startMonth={subMonths(new Date(), 1)}
          endMonth={addMonths(new Date(), 1)}
          buttonVariant="ghost"
          classNames={{
            root: "w-full min-h-[435px] rounded-xl border border-border bg-card text-card-foreground shadow sm:max-w-md",
          }}
        />
      ) : subscriptionsQuery.isError || !subscriptionsQuery.data ? (
        <p>{m.calendar_error()}</p>
      ) : (
        <Calendar
          mode="single"
          startMonth={subMonths(new Date(), 1)}
          endMonth={addMonths(new Date(), 1)}
          buttonVariant="ghost"
          classNames={{
            root: "w-full min-h-[435px] rounded-xl border border-border bg-card text-card-foreground shadow sm:max-w-md",
          }}
          components={{
            DayButton: ({ className, day, modifiers, ...props }) => {
              const [isOpen, setIsOpen] = useState(false)
              const dueSubscriptions = subscriptionsQuery.data.filter(
                (sub) =>
                  isSameDay(day.date, sub.nextPaymentDate) ||
                  isSameDay(day.date, sub.previousPaymentDate) ||
                  isSameDay(day.date, sub.secondNextPaymentDate),
              )

              if (dueSubscriptions.length === 0) {
                return (
                  <CalendarDayButton
                    className={className}
                    day={day}
                    modifiers={{ ...modifiers, selected: false }}
                    {...props}
                  />
                )
              }

              return (
                <Popover open={isOpen} onOpenChange={setIsOpen}>
                  <PopoverTrigger
                    render={
                      <CalendarDayButton
                        className={cn(
                          className,
                          isBefore(day.date, new Date()) && "bg-primary/50!",
                        )}
                        day={day}
                        modifiers={{ ...modifiers, selected: true }}
                        {...props}
                        onClick={() => setIsOpen(true)}
                      />
                    }
                  />
                  <PopoverContent className="flex max-w-md flex-col gap-0 p-4">
                    {dueSubscriptions.map((subscription) => (
                      <div
                        key={subscription.id}
                        className="flex items-center gap-2 not-first:mt-2 not-first:border-t not-first:pt-2"
                      >
                        {subscription.image && (
                          <img
                            src={subscription.image}
                            alt={subscription.name}
                            width={64}
                            height={48}
                            className="max-h-6 max-w-5 object-contain"
                          />
                        )}
                        <h4 className="grow font-semibold">{subscription.name}</h4>
                        {subscription.currency !== userCurrency && (
                          <span className="text-muted-foreground tabular-nums">
                            ({formatPrice(subscription.originalPrice, subscription.currency)})
                          </span>
                        )}
                        <span className="tabular-nums">
                          {formatPrice(subscription.price, userCurrency)}
                        </span>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
              )
            },
          }}
        />
      )}
    </>
  )
}
