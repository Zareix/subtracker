import { createFileRoute } from "@tanstack/react-router";
import { AppearanceSettings } from "~/components/profile/appearance";
import { CredentialsForm } from "~/components/profile/credentials";
import { CurrencySettings } from "~/components/profile/currency-settings";
import { UserInfoForm } from "~/components/profile/user-info";
import { Separator } from "~/components/ui/separator";
import { authClient } from "~/lib/auth-client";
import { m } from "~/paraglide/messages";

export const Route = createFileRoute("/_private/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { data: session } = authClient.useSession();
  const user = session?.user;

  if (!user) return null;

  return (
    <div className="grid w-full max-w-lg items-start gap-6">
      <header className="flex flex-wrap items-center justify-between">
        <h1 className="font-bold text-3xl">
          {m.profile_welcome({ name: user.name })}
        </h1>
      </header>
      <UserInfoForm user={user} />
      <CurrencySettings />
      <AppearanceSettings />
      <Separator className="my-4 lg:hidden" />
      <CredentialsForm userId={user.id} />
    </div>
  );
}
