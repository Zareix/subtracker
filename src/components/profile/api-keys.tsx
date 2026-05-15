import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, LoaderCircleIcon, TrashIcon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { authClient } from "~/lib/auth-client";
import { m } from "~/paraglide/messages";

const schema = z.object({
  name: z.string().min(1),
});

type Props = { userId: string };

export const ApiKeys = ({ userId }: Props) => {
  const [lastCreatedKey, setLastCreatedKey] = useState<{
    id: string;
    name: string;
    key: string;
  } | null>(null);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof schema>) =>
      authClient.apiKey.create({ name: data.name }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys", userId] });
      form.reset();
      if (data?.data?.key) {
        setLastCreatedKey({
          id: data.data.id ?? "",
          name: data.data.name ?? "",
          key: data.data.key,
        });
      }
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (keyId: string) => authClient.apiKey.delete({ keyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apiKeys", userId] });
      toast.success(m.profile_api_keys_deleted_success());
    },
    onError: (err) => toast.error(err.message),
  });

  const apiKeysQuery = useQuery({
    queryKey: ["apiKeys", userId],
    queryFn: () => authClient.apiKey.list(),
    select: (data) => data.data,
  });

  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      const parsed = schema.safeParse(value);
      if (!parsed.success) return;
      createMutation.mutate(parsed.data);
    },
  });

  return (
    <section>
      <h3 className="mb-4 font-semibold text-lg">
        {m.profile_api_keys_title()}
      </h3>

      {lastCreatedKey && (
        <Card className="mb-6 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 py-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-green-800 text-lg dark:text-green-200">
                {m.profile_api_keys_new_created()}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLastCreatedKey(null)}
                className="h-6 w-6 p-0 text-green-600 hover:text-green-800 dark:text-green-400"
              >
                <XIcon size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="font-medium text-green-800 dark:text-green-200">
                {lastCreatedKey.name}
              </p>
              <p className="text-green-700 text-sm dark:text-green-300">
                {m.profile_api_keys_save_warning()}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded bg-green-100 p-3 dark:bg-green-900">
              <code className="flex-1 break-all font-mono text-green-800 text-sm dark:text-green-200">
                {lastCreatedKey.key}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(lastCreatedKey.key);
                  toast.success(m.profile_api_keys_copied());
                }}
                className="h-8 w-8 p-0 text-green-600 hover:text-green-800 dark:text-green-400"
              >
                <CopyIcon size={16} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {apiKeysQuery.isLoading ? (
        <div className="flex items-center gap-2">
          <LoaderCircleIcon className="animate-spin" size={16} />
          <p>{m.profile_api_keys_loading()}</p>
        </div>
      ) : !apiKeysQuery.data?.apiKeys ||
        apiKeysQuery.isError ||
        apiKeysQuery.data.apiKeys.length === 0 ? (
        <p className="text-muted-foreground">
          {m.profile_api_keys_no_created()}
        </p>
      ) : (
        <div className="space-y-3">
          {apiKeysQuery.data.apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="rounded-lg border px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{apiKey.name}</span>
                <span className="text-muted-foreground text-xs">
                  {m.common_created_on({
                    date: new Date(apiKey.createdAt).toLocaleDateString(),
                  })}
                </span>
                {apiKey.expiresAt && (
                  <span className="rounded bg-muted px-2 py-1 text-muted-foreground text-xs">
                    | {m.profile_api_keys_expires()}:{" "}
                    {new Date(apiKey.expiresAt).toLocaleDateString()}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteMutation.mutate(apiKey.id)}
                  disabled={deleteMutation.isPending}
                  className="ml-auto text-destructive hover:text-destructive"
                >
                  {deleteMutation.isPending ? (
                    <LoaderCircleIcon className="animate-spin" size={20} />
                  ) : (
                    <TrashIcon size={20} />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form
        className="mt-6"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field name="name">
            {(field) => (
              <Field data-invalid={field.state.meta.errors.length > 0}>
                <FieldLabel htmlFor="api-key-name">
                  {m.profile_api_keys_name()}
                </FieldLabel>
                <Input
                  id="api-key-name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder={m.profile_api_keys_placeholder()}
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
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full sm:w-auto"
            >
              {createMutation.isPending ? (
                <>
                  <LoaderCircleIcon className="mr-2 animate-spin" size={16} />
                  {m.profile_api_keys_creating()}
                </>
              ) : (
                m.profile_api_keys_create()
              )}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </section>
  );
};
