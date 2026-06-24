"use client"

import {
  type MultiSessionAuthClient,
  useAuth,
  useSession,
  useSetActiveSession,
} from "@better-auth-ui/react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ChevronsUpDown, LanguagesIcon, LogIn, LogOut, Settings, UserPlus2 } from "lucide-react"
import { type ComponentType, isValidElement, type ReactElement, type ReactNode } from "react"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { useSidebar } from "~/components/ui/sidebar"
import { Currencies, type Currency } from "~/lib/constant"
import { cn, currencyToSymbol } from "~/lib/utils"
import { m } from "~/paraglide/messages"
import { getLocale, setLocale } from "~/paraglide/runtime"

import { UserAvatar } from "./user-avatar"
import { UserView } from "./user-view"

/** Auth states a `UserButton` link can be visible in. */
export type UserButtonLinkVisibility = "authenticated" | "unauthenticated" | "always"

/** A simple link entry rendered as a `DropdownMenuItem` in the `UserButton` menu. */
export type UserButtonLink = {
  /** Visible label. */
  label: ReactNode
  /** Destination URL. */
  href: string
  /** Optional leading icon. Sized/coloured to match built-in items. */
  icon?: ReactNode
  /** Forwarded to the underlying `DropdownMenuItem`. */
  variant?: "default" | "destructive"
  /**
   * When this link is visible based on auth state.
   * @default "always"
   */
  visibility?: UserButtonLinkVisibility
}

export type UserButtonProps = {
  className?: string
  align?: "center" | "end" | "start" | undefined
  sideOffset?: number
  size?: "default" | "icon"
  variant?: "default" | "destructive" | "ghost" | "link" | "outline" | "secondary"
  /** Additional menu entries rendered above the built-in items. */
  links?: (UserButtonLink | ReactElement)[]
  /** Hide the built-in "Settings" link. Useful when replacing it via `links`. */
  hideSettings?: boolean
}

function renderUserLink(
  link: UserButtonLink | ReactElement,
  Link: ComponentType<{ href: string; children?: ReactNode }>,
  fallbackKey: string,
): ReactNode {
  if (isValidElement(link)) return link

  const { label, href, icon, variant } = link
  return (
    <DropdownMenuItem key={fallbackKey} variant={variant} render={<Link href={href} />}>
      {icon}
      {label}
    </DropdownMenuItem>
  )
}

/**
 * Render a user dropdown button that shows user info, settings, theme controls, and authentication actions.
 *
 * Includes user profile, settings link, optional multi-session account switching, theme picker,
 * and sign-in/sign-up/sign-out actions depending on authentication state.
 *
 * @param className - Additional CSS classes applied to the button trigger
 * @param align - Alignment of the dropdown menu relative to the trigger
 * @param sideOffset - Offset between the trigger and the dropdown menu
 * @param size - "icon" renders only the avatar; "default" renders a full button with label and chevron
 * @param variant - Visual variant of the trigger button
 * @param links - Additional menu entries rendered above the built-in items
 * @param hideSettings - Hide the built-in "Settings" link
 * @returns The dropdown menu component with user actions
 */
export function UserButton({
  className,
  align,
  sideOffset,
  size = "default",
  variant = "ghost",
  links,
  hideSettings = false,
}: UserButtonProps) {
  const { authClient, basePaths, viewPaths, localization, plugins, Link } = useAuth()

  const { isPending: settingActiveSession } = useSetActiveSession(
    authClient as MultiSessionAuthClient,
  )
  const {
    data: session,
    isPending: sessionPending,
    refetch: refetchSession,
  } = useSession(authClient)

  const userLinks = links?.flatMap((link, index) => {
    if (!isValidElement(link)) {
      const visibility = link.visibility ?? "always"
      if (visibility === "authenticated" && !session) return []
      if (visibility === "unauthenticated" && session) return []
    }
    return [renderUserLink(link, Link, `user-button-link-${index.toString()}`)]
  })

  const queryClient = useQueryClient()
  const locale = getLocale()
  const { toggleSidebar, isMobile } = useSidebar()
  const updateBaseCurrencyMutation = useMutation({
    mutationFn: (newCurrency: string) =>
      authClient.updateUser({ baseCurrency: newCurrency as Currency }),
    onSuccess: (res) => {
      if (res.error) {
        toast.error(res.error.message)
        return
      }
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] })
      refetchSession()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to update currency")
    },
  })

  const handleLocaleChange = (newLocale: "fr" | "en") => {
    setLocale(newLocale)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(size === "icon" && "rounded-full")}
        render={
          size === "icon" ? (
            <UserAvatar className={className} />
          ) : (
            <Button
              variant={variant}
              className={cn(
                "h-auto w-full shrink border border-border py-2.5 font-normal",
                className,
              )}
              size="lg"
            >
              {session || sessionPending || settingActiveSession ? (
                <UserView isPending={!!settingActiveSession} />
              ) : (
                <>
                  <UserAvatar />

                  <div className="grid flex-1 text-left text-sm leading-tight">
                    {localization.auth.account}
                  </div>
                </>
              )}

              <ChevronsUpDown className="ml-auto size-4" />
            </Button>
          )
        }
      />

      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] max-w-[48svw] min-w-40 md:min-w-56"
        sideOffset={sideOffset}
        align={align}
        autoFocus={false}
      >
        {session && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-sm font-normal">
                <UserView />
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />
          </>
        )}

        {session ? (
          <>
            {userLinks}

            {!hideSettings && (
              <DropdownMenuItem
                onClick={() => isMobile && toggleSidebar()}
                render={<Link href={`${basePaths.settings}/${viewPaths.settings.account}`} />}
              >
                <Settings className="text-muted-foreground" />
                {localization.settings.settings}
              </DropdownMenuItem>
            )}

            {plugins.flatMap((plugin) =>
              plugin.userMenuItems?.map((Item, index) => (
                <Item key={`${plugin.id}-${index.toString()}`} />
              )),
            )}

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <span className="mr-2">{currencyToSymbol(session.user.baseCurrency)}</span>
                {m.nav_currency()}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="max-h-64 overflow-auto">
                  <DropdownMenuRadioGroup
                    value={(session.user.baseCurrency as string) ?? "USD"}
                    onValueChange={(value) => updateBaseCurrencyMutation.mutate(value as Currency)}
                  >
                    {Currencies.map((currency) => (
                      <DropdownMenuRadioItem
                        key={currency}
                        value={currency}
                        className="flex items-center gap-2 capitalize"
                      >
                        {currencyToSymbol(currency)} {m[`currency_${currency}`]()}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <LanguagesIcon className="size-4" />
                {m.nav_language()}
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={locale} onValueChange={handleLocaleChange}>
                    <DropdownMenuRadioItem value="en" className="flex items-center gap-2">
                      {m.nav_language_en()}
                    </DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="fr" className="flex items-center gap-2">
                      {m.nav_language_fr()}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              render={<Link href={`${basePaths.auth}/${viewPaths.auth.signOut}`} />}
            >
              <LogOut className="text-muted-foreground" />
              {localization.auth.signOut}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            {userLinks}

            <DropdownMenuItem render={<Link href={`${basePaths.auth}/${viewPaths.auth.signIn}`} />}>
              <LogIn className="text-muted-foreground" />
              {localization.auth.signIn}
            </DropdownMenuItem>

            <DropdownMenuItem render={<Link href={`${basePaths.auth}/${viewPaths.auth.signUp}`} />}>
              <UserPlus2 className="text-muted-foreground" />
              {localization.auth.signUp}
            </DropdownMenuItem>

            {plugins.flatMap((plugin) =>
              plugin.userMenuItems?.map((Item, index) => (
                <Item key={`${plugin.id}-${index.toString()}`} />
              )),
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
