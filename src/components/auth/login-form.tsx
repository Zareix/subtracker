import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CalendarSyncIcon, KeySquareIcon } from "lucide-react";
import { Fragment, useState } from "react";
import { AuthProvidersIcon } from "~/components/auth/auth-providers-icon";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type AuthProvider, authClient } from "~/lib/auth-client";
import { cn } from "~/lib/utils";
import { getAuthProviders } from "~/functions/users.functions";
import * as m from "~/paraglide/messages";

export function LoginForm({ redirect = "/" }: { redirect?: string }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const providersQuery = useQuery({
    queryKey: ["auth-providers"],
    queryFn: () => getAuthProviders(),
  });

  const lastMethod = authClient.getLastUsedLoginMethod();

  const signInMutation = useMutation({
    mutationFn: () =>
      authClient.signIn.email({ email: email.trim(), password }),
    onSuccess: (res) => {
      if (res.error) {
        setError(res.error.message ?? m.login_error_failed());
      } else {
        navigate({ to: redirect as "/" });
      }
    },
    onError: () => setError(m.login_error_failed()),
  });

  const passKeyMutation = useMutation({
    mutationFn: () => authClient.signIn.passkey(),
    onSuccess: (res) => {
      if (res?.error) {
        setError(res.error.message?.toString() ?? m.login_error_failed());
      } else {
        navigate({ to: redirect as "/" });
      }
    },
    onError: () => setError(m.login_error_failed()),
  });

  const oauthMutation = useMutation({
    mutationFn: (providerId: AuthProvider) =>
      authClient.signIn.oauth2({
        providerId: providerId.replace("oauth-", ""),
      }),
    onSuccess: (res) => {
      if (res?.error) {
        setError(res.error.message ?? m.login_error_failed());
      } else {
        navigate({ to: redirect as "/" });
      }
    },
    onError: () => setError(m.login_error_failed()),
  });

  const requestReset = () => {
    if (!email.trim()) {
      setError(m.login_error_email_first());
      return;
    }
    authClient
      .requestPasswordReset({ email: email.trim(), redirectTo: "/reset-password" })
      .then((res) => {
        if (res.error) throw new Error(res.error.message);
        setError(null);
        setInfo(m.login_success_reset_sent());
      })
      .catch(() => setError(m.login_error_reset_failed()));
  };

  if (providersQuery.isLoading) {
    return <div className="h-64 w-full max-w-sm animate-pulse rounded-xl bg-muted" />;
  }

  if (providersQuery.isError || !providersQuery.data) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="pt-6 text-sm text-destructive">
          {m.login_error_load_providers()}
        </CardContent>
      </Card>
    );
  }

  const providers = providersQuery.data;

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-center gap-2 self-center py-4 font-medium text-xl">
          <div className="flex size-9 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <CalendarSyncIcon className="size-5" />
          </div>
          Subtracker
        </div>
        <CardTitle>{m.login_title()}</CardTitle>
      </CardHeader>
      <CardContent className="mt-2 grid gap-3">
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {info && (
          <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">
            {info}
          </p>
        )}

        {providers.map((provider) => (
          <Fragment key={provider}>
            {provider === "password" && (
              <>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setError(null);
                    signInMutation.mutate();
                  }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="login-email" className="text-sm font-medium">
                      Email
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="user@example.com"
                      autoComplete="email webauthn"
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center">
                      <label
                        htmlFor="login-password"
                        className="text-sm font-medium"
                      >
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={requestReset}
                        className="ml-auto text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                      >
                        {m.login_forgot_password()}
                      </button>
                    </div>
                    <input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      autoComplete="current-password webauthn"
                      required
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>
                  <div className="relative">
                    <button
                      type="submit"
                      disabled={signInMutation.isPending}
                      className="relative w-full inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
                    >
                      {m.login_button()}
                    </button>
                    {lastMethod === "email" && (
                      <LastUsedBadge />
                    )}
                  </div>
                </form>
                <div className="relative my-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="flex-1 border-t border-border" />
                  {m.login_or_continue_with()}
                  <div className="flex-1 border-t border-border" />
                </div>
              </>
            )}

            {provider === "passkey" && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    passKeyMutation.mutate();
                  }}
                  disabled={passKeyMutation.isPending}
                  className={cn(
                    "relative w-full inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50",
                  )}
                >
                  <KeySquareIcon size={16} />
                  {m.login_with_passkey()}
                </button>
                {lastMethod === "passkey" && <LastUsedBadge />}
              </div>
            )}

            {provider.startsWith("oauth-") && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    oauthMutation.mutate(provider);
                  }}
                  disabled={oauthMutation.isPending}
                  className="relative w-full inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50"
                >
                  <AuthProvidersIcon providerId={provider} />
                  {m.login_with_oauth({ provider: provider.replace("oauth-", "") })}
                </button>
                {lastMethod === provider.replace("oauth-", "") && (
                  <LastUsedBadge />
                )}
              </div>
            )}
          </Fragment>
        ))}
      </CardContent>
    </Card>
  );
}

function LastUsedBadge() {
  return (
    <span className="absolute -top-2.5 -right-2.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1.5 text-[10px] font-medium text-secondary-foreground">
      {m.login_last_used()}
    </span>
  );
}
