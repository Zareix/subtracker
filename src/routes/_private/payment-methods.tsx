import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import { CreatePaymentMethodDialog } from "~/components/settings/payment-methods/create"
import { DeletePaymentMethodDialog } from "~/components/settings/payment-methods/delete"
import { EditPaymentMethodDialog } from "~/components/settings/payment-methods/edit"
import { Skeleton } from "~/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { getPaymentMethods } from "~/functions/payment-methods.functions"
import { m } from "~/paraglide/messages"

export const Route = createFileRoute("/_private/payment-methods")({
  component: SettingsPage,
})

function SettingsPage() {
  const paymentMethodsQuery = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: () => getPaymentMethods(),
  })

  if (paymentMethodsQuery.isError) {
    return (
      <div>
        {m.settings_error()}: {paymentMethodsQuery.error?.message}
      </div>
    )
  }

  return (
    <div className="grid max-w-[100vw] items-start gap-4">
      <section>
        <header className="flex flex-wrap items-center justify-between">
          <h1 className="text-3xl font-bold">{m.settings_payment_methods_title()}</h1>
          <CreatePaymentMethodDialog />
        </header>
        <div className="mt-2 max-w-[calc(100vw-2rem)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-17.5">{m.settings_form_image()}</TableHead>
                <TableHead>{m.settings_form_name()}</TableHead>
                <TableHead className="text-end">{m.settings_actions_label()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentMethodsQuery.isLoading && (
                <TableRow>
                  <TableCell>
                    <Skeleton className="h-10 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
              {paymentMethodsQuery.data?.map((pm) => (
                <TableRow key={pm.id}>
                  <TableCell>
                    {pm.image && (
                      <img
                        src={pm.image}
                        alt={pm.name}
                        width={64}
                        height={40}
                        className="max-h-10 max-w-16 object-contain"
                      />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{pm.name}</TableCell>
                  <TableCell className="flex items-center justify-end gap-2">
                    <DeletePaymentMethodDialog paymentMethod={pm} />
                    <EditPaymentMethodDialog paymentMethod={pm} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  )
}
