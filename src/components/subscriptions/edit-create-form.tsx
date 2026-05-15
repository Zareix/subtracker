import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addYears, format, subYears } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { ImageFileUploader } from "~/components/image-uploader";
import { CategoryIcon } from "~/components/subscriptions/categories/icon";
import { ImageSearch } from "~/components/subscriptions/image-search";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { DialogFooter } from "~/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import {
  createSubscription,
  editSubscription,
} from "~/functions/subscriptions.functions";
import { getCategories } from "~/functions/categories.functions";
import { getPaymentMethods } from "~/functions/payment-methods.functions";
import { getUsers } from "~/functions/users.functions";
import { authClient } from "~/lib/auth-client";
import { Currencies, SCHEDULES } from "~/lib/constant";
import { cn } from "~/lib/utils";
import { m } from "~/paraglide/messages";
import type { SubscriptionItem } from "~/functions/subscriptions.functions";

type FormSubscription = Omit<SubscriptionItem, "id"> & { id?: number };

const SCHEDULE_LABELS: Record<(typeof SCHEDULES)[number], () => string> = {
  Monthly: m.schedule_monthly,
  Quarterly: m.schedule_quarterly,
  Semiannual: m.schedule_semiannual,
  Yearly: m.schedule_yearly,
};

const schema = z.object({
  name: z.string().min(1),
  description: z.string(),
  category: z.number().positive(),
  image: z.string().optional(),
  price: z.number().positive(),
  currency: z.enum(Currencies),
  paymentMethod: z.number().positive(),
  firstPaymentDate: z.date(),
  schedule: z.enum(SCHEDULES),
  payedBy: z.array(z.string()).min(1),
  url: z.url().optional().or(z.literal("")),
});

export const EditCreateForm = ({
  subscription,
  onFinished,
}: {
  subscription?: FormSubscription;
  onFinished?: () => void;
}) => {
  const session = authClient.useSession();
  const queryClient = useQueryClient();
  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: () => getUsers(),
  });
  const paymentMethodsQuery = useQuery({
    queryKey: ["paymentMethods"],
    queryFn: () => getPaymentMethods(),
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => getCategories(),
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof schema>) =>
      createSubscription({
        data: {
          ...data,
          firstPaymentDate: data.firstPaymentDate.toISOString(),
          url: data.url || undefined,
        },
      }),
    onSuccess: () => {
      toast.success(m.subscription_form_create_success());
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      onFinished?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const editMutation = useMutation({
    mutationFn: (data: z.infer<typeof schema> & { id: number }) =>
      editSubscription({
        data: {
          ...data,
          firstPaymentDate: data.firstPaymentDate.toISOString(),
          url: data.url || undefined,
        },
      }),
    onSuccess: () => {
      toast.success(m.subscription_form_edit_success());
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      onFinished?.();
    },
    onError: (err) => toast.error(err.message),
  });

  const form = useForm({
    defaultValues: {
      name: subscription?.name ?? "",
      description: subscription?.description ?? "",
      category: subscription?.category.id ?? 1,
      image: subscription?.image ?? (undefined as string | undefined),
      price: subscription?.originalPrice ?? 0,
      currency:
        subscription?.currency ?? session.data?.user.baseCurrency ?? "EUR",
      paymentMethod: subscription?.paymentMethod.id ?? 1,
      firstPaymentDate: subscription?.firstPaymentDate ?? new Date(),
      schedule: subscription?.schedule ?? ("Monthly" as const),
      payedBy:
        subscription?.users.map((u) => u.id) ??
        (session.data?.user.id ? [session.data.user.id] : []),
      url: subscription?.url ?? "",
    },
    onSubmit: async ({ value }) => {
      const parsed = schema.safeParse(value);
      if (!parsed.success) return;
      const data = parsed.data;
      if (subscription?.id) {
        editMutation.mutate({ ...data, id: subscription.id });
      } else {
        createMutation.mutate(data);
      }
    },
  });

  const isPending = createMutation.isPending || editMutation.isPending;

  if (
    usersQuery.isLoading ||
    paymentMethodsQuery.isLoading ||
    categoriesQuery.isLoading
  ) {
    return <div>{m.subscription_form_loading()}</div>;
  }

  if (
    usersQuery.isError ||
    paymentMethodsQuery.isError ||
    categoriesQuery.isError
  ) {
    return <div>{m.subscription_form_error()}</div>;
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        {/* Name + image upload + image search */}
        <div className="grid grid-cols-12 items-center gap-2">
          <form.Field name="name">
            {(field) => (
              <Field
                data-invalid={field.state.meta.errors.length > 0}
                className="col-span-8"
              >
                <FieldLabel htmlFor="sub-name">
                  {m.subscription_form_name()}
                </FieldLabel>
                <Input
                  id="sub-name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={m.subscription_form_name_placeholder()}
                />
                {field.state.meta.errors.length > 0 && (
                  <FieldError
                    errors={field.state.meta.errors.map((e) => ({
                      message: String(e),
                    }))}
                  />
                )}
              </Field>
            )}
          </form.Field>
          <form.Field name="image">
            {(field) => (
              <ImageFileUploader
                fileUrl={field.state.value}
                setFileUrl={(url) => field.handleChange(url)}
              />
            )}
          </form.Field>
          <form.Field name="image">
            {(field) => (
              <ImageSearch
                query={form.state.values.name}
                setFileUrl={(url) => field.handleChange(url)}
              />
            )}
          </form.Field>
        </div>

        {/* Category + URL */}
        <div className="flex">
          <form.Field name="category">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor="sub-category">
                  {m.subscription_form_category()}
                </FieldLabel>
                <Select
                  value={field.state.value?.toString()}
                  onValueChange={(v) => field.handleChange(Number(v))}
                  items={
                    categoriesQuery.data?.map((p) => ({
                      value: p.id.toString(),
                      label: (
                        <>
                          {p.icon && (
                            <CategoryIcon
                              icon={p.icon}
                              className="max-h-5 max-w-5 object-contain"
                            />
                          )}
                          {p.name}
                        </>
                      ),
                    })) ?? []
                  }
                >
                  <SelectTrigger id="sub-category" className="min-w-42">
                    <SelectValue
                      placeholder={m.subscription_form_category_placeholder()}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesQuery.data?.map((p) => (
                      <SelectItem value={p.id.toString()} key={p.id}>
                        <div className="flex items-center gap-1">
                          {p.icon && (
                            <CategoryIcon
                              icon={p.icon}
                              className="max-h-5 max-w-5 object-contain"
                            />
                          )}
                          {p.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors.length > 0 && (
                  <FieldError
                    errors={field.state.meta.errors.map((e) => ({
                      message: String(e),
                    }))}
                  />
                )}
              </Field>
            )}
          </form.Field>
          <Separator
            orientation="vertical"
            className="mx-2 my-auto flex h-12"
          />
          <form.Field name="url">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor="sub-url">
                  {m.subscription_form_url()}
                </FieldLabel>
                <Input
                  id="sub-url"
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={m.subscription_form_url_placeholder()}
                />
                {field.state.meta.errors.length > 0 && (
                  <FieldError
                    errors={field.state.meta.errors.map((e) => ({
                      message: String(e),
                    }))}
                  />
                )}
              </Field>
            )}
          </form.Field>
        </div>

        {/* Description */}
        <form.Field name="description">
          {(field) => (
            <Field>
              <FieldLabel htmlFor="sub-description">
                {m.subscription_form_description()}
              </FieldLabel>
              <Input
                id="sub-description"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={m.subscription_form_description_placeholder()}
              />
            </Field>
          )}
        </form.Field>

        {/* Price + Currency | Payment Method */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex">
            <form.Field name="price">
              {(field) => (
                <Field
                  data-invalid={field.state.meta.errors.length > 0}
                  className="grow"
                >
                  <FieldLabel htmlFor="sub-price">
                    {m.subscription_form_price()}
                  </FieldLabel>
                  <Input
                    id="sub-price"
                    type="number"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                    className="rounded-r-none"
                  />
                  {field.state.meta.errors.length > 0 && (
                    <FieldError
                      errors={field.state.meta.errors.map((e) => ({
                        message: String(e),
                      }))}
                    />
                  )}
                </Field>
              )}
            </form.Field>
            <form.Field name="currency">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor="sub-currency">
                    {m.subscription_form_currency()}
                  </FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) =>
                      field.handleChange(v as typeof field.state.value)
                    }
                    items={Currencies.map((c) => ({ value: c, label: c }))}
                  >
                    <SelectTrigger
                      id="sub-currency"
                      className="rounded-l-none border-l-0"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Currencies.map((c) => (
                        <SelectItem value={c} key={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              )}
            </form.Field>
          </div>
          <form.Field name="paymentMethod">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor="sub-pm">
                  {m.subscription_form_payment_method()}
                </FieldLabel>
                <Select
                  value={field.state.value?.toString()}
                  onValueChange={(v) => field.handleChange(Number(v))}
                  items={
                    paymentMethodsQuery.data?.map((p) => ({
                      value: p.id.toString(),
                      label: p.name,
                    })) ?? []
                  }
                >
                  <SelectTrigger id="sub-pm" className="w-full">
                    <SelectValue
                      placeholder={m.subscription_form_payment_method_placeholder()}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethodsQuery.data?.map((p) => (
                      <SelectItem value={p.id.toString()} key={p.id}>
                        <div className="flex items-center gap-1">
                          {p.image && (
                            <img
                              src={p.image}
                              alt={p.name}
                              width={20}
                              height={20}
                              className="max-h-5 max-w-5 object-contain"
                            />
                          )}
                          {p.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {field.state.meta.errors.length > 0 && (
                  <FieldError
                    errors={field.state.meta.errors.map((e) => ({
                      message: String(e),
                    }))}
                  />
                )}
              </Field>
            )}
          </form.Field>
        </div>

        {/* Payed by */}
        <form.Field name="payedBy">
          {(field) => (
            <Field
              data-invalid={field.state.meta.errors.length > 0}
              className="grow"
            >
              <FieldLabel htmlFor="sub-payed-by">
                {m.subscription_form_payed_by()}
              </FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as string[])}
                multiple
                items={
                  usersQuery.data?.map((u) => ({
                    value: u.id,
                    label: u.name,
                  })) ?? []
                }
              >
                <SelectTrigger id="sub-payed-by" className="w-full">
                  <SelectValue
                    placeholder={m.subscription_form_payed_by_placeholder()}
                  />
                </SelectTrigger>
                <SelectContent>
                  {usersQuery.data?.map((u) => (
                    <SelectItem value={u.id} key={u.id}>
                      {u.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.state.meta.errors.length > 0 && (
                <FieldError
                  errors={field.state.meta.errors.map((e) => ({
                    message: String(e),
                  }))}
                />
              )}
            </Field>
          )}
        </form.Field>

        {/* Schedule + First payment date */}
        <div className="flex gap-2">
          <form.Field name="schedule">
            {(field) => (
              <Field className="min-w-40">
                <FieldLabel htmlFor="sub-schedule">
                  {m.subscription_form_schedule()}
                </FieldLabel>
                <Select
                  value={field.state.value}
                  onValueChange={(v) =>
                    field.handleChange(v as typeof field.state.value)
                  }
                  items={SCHEDULES.map((s) => ({
                    value: s,
                    label: SCHEDULE_LABELS[s](),
                  }))}
                >
                  <SelectTrigger id="sub-schedule" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SCHEDULES.map((s) => (
                      <SelectItem value={s} key={s}>
                        {SCHEDULE_LABELS[s]()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form.Field>
          <form.Field name="firstPaymentDate">
            {(field) => (
              <Field
                data-invalid={field.state.meta.errors.length > 0}
                className="grow"
              >
                <FieldLabel htmlFor="sub-date">
                  {m.subscription_form_first_payment_date()}
                </FieldLabel>
                <Popover modal>
                  <PopoverTrigger
                    render={
                      <Button
                        id="sub-date"
                        variant="outline"
                        className={cn(
                          "h-9 w-full justify-start text-left font-normal",
                          !field.state.value && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {field.state.value ? (
                          format(field.state.value, "dd/MM/yyyy")
                        ) : (
                          <span>{m.subscription_form_pick_date()}</span>
                        )}
                      </Button>
                    }
                  />
                  <PopoverContent className="pointer-events-auto w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.state.value}
                      onSelect={(date) => date && field.handleChange(date)}
                      autoFocus
                      captionLayout="dropdown"
                      startMonth={subYears(new Date(), 10)}
                      endMonth={addYears(new Date(), 10)}
                    />
                  </PopoverContent>
                </Popover>
                {field.state.meta.errors.length > 0 && (
                  <FieldError
                    errors={field.state.meta.errors.map((e) => ({
                      message: String(e),
                    }))}
                  />
                )}
              </Field>
            )}
          </form.Field>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isPending}>
            {isPending ? "..." : m.subscription_form_submit()}
          </Button>
        </DialogFooter>
      </FieldGroup>
    </form>
  );
};
