import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { CalendarSyncIcon } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { authClient } from "~/lib/auth-client";
import * as m from "~/paraglide/messages";

export function ResetPasswordForm({ token }: { token: string }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const resetMutation = useMutation({
    mutationFn: () => authClient.resetPassword({ newPassword: password, token }),
    onSuccess: (res) => {
      if (res.error) {
        setError(res.error.message ?? m.reset_password_error_failed());
      } else {
          navigate({ to: "/login" });
      }
    },
    onError: () => setError(m.reset_password_error_failed()),
  });

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-center gap-2 self-center py-4 font-medium text-xl">
          <div className="flex size-9 items-center justify-center rounded-sm bg-primary text-primary-foreground">
            <CalendarSyncIcon className="size-5" />
          </div>
          Subtracker
        </div>
        <CardTitle>{m.reset_password_title()}</CardTitle>
      </CardHeader>
      <CardContent className="mt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (password.length < 8) {
              setError(m.reset_password_error_min_length());
              return;
            }
            setError(null);
            resetMutation.mutate();
          }}
          className="flex flex-col gap-4"
        >
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="reset-password" className="text-sm font-medium">
              {m.reset_password_new_password()}
            </label>
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={m.reset_password_placeholder()}
              required
              minLength={8}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={resetMutation.isPending}
            className="w-full inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {m.reset_password_submit()}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}
