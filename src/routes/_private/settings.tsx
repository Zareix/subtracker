import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CreateCategoryDialog } from "~/components/settings/categories/create";
import { DeleteCategoryDialog } from "~/components/settings/categories/delete";
import { EditCategoryDialog } from "~/components/settings/categories/edit";
import { CreatePaymentMethodDialog } from "~/components/settings/payment-methods/create";
import { DeletePaymentMethodDialog } from "~/components/settings/payment-methods/delete";
import { EditPaymentMethodDialog } from "~/components/settings/payment-methods/edit";
import { CategoryIcon } from "~/components/subscriptions/categories/icon";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { getCategories } from "~/functions/categories.functions";
import { getPaymentMethods } from "~/functions/payment-methods.functions";
import { m } from "~/paraglide/messages";

export const Route = createFileRoute("/_private/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const paymentMethodsQuery = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: () => getPaymentMethods(),
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  if (paymentMethodsQuery.isError || categoriesQuery.isError) {
    return (
      <div>
        {m.settings_error()}:{" "}
        {paymentMethodsQuery.error?.message ?? categoriesQuery.error?.message}
      </div>
    );
  }

  return (
    <div className="grid max-w-[100vw] items-start gap-4">
      <section>
        <header className="flex flex-wrap items-center justify-between">
          <h1 className="font-bold text-3xl">
            {m.settings_payment_methods_title()}
          </h1>
          <CreatePaymentMethodDialog />
        </header>
        <div className="mt-2 max-w-[calc(100vw-2rem)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-17.5">
                  {m.settings_form_image()}
                </TableHead>
                <TableHead>{m.settings_form_name()}</TableHead>
                <TableHead className="text-end">
                  {m.settings_actions_label()}
                </TableHead>
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

      <section>
        <header className="flex flex-wrap items-center justify-between">
          <h1 className="font-bold text-3xl">
            {m.settings_categories_title()}
          </h1>
          <CreateCategoryDialog />
        </header>
        <div className="mt-2 max-w-[calc(100vw-2rem)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">
                  {m.settings_icon_label()}
                </TableHead>
                <TableHead>{m.settings_form_name()}</TableHead>
                <TableHead className="text-end">
                  {m.settings_actions_label()}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesQuery.isLoading && (
                <TableRow>
                  <TableCell>
                    <Skeleton className="size-6" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              )}
              {categoriesQuery.data?.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell>
                    <CategoryIcon icon={cat.icon} />
                  </TableCell>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell className="flex items-center justify-end gap-2">
                    <DeleteCategoryDialog category={cat} />
                    <EditCategoryDialog category={cat} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}
