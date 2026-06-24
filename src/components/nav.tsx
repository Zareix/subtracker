"use client"
import { Link, useRouterState } from "@tanstack/react-router"
import {
  Calendar1Icon,
  CalendarSyncIcon,
  ChartColumnIcon,
  CreditCardIcon,
  HomeIcon,
  PlusIcon,
  ShieldIcon,
  TagIcon,
  UserCircle2Icon,
} from "lucide-react"

import { UserButton } from "~/components/auth/user/user-button"
import { CreateSubscriptionDialog } from "~/components/subscriptions/create"
import { Button } from "~/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "~/components/ui/sidebar"
import { authClient } from "~/lib/auth-client"
import { cn } from "~/lib/utils"
import { m } from "~/paraglide/messages"

export const NAV_ITEMS = [
  {
    title: m.nav_home,
    url: "/",
    icon: HomeIcon,
    keepParams: true,
  },
  {
    title: m.nav_calendar,
    url: "/calendar",
    icon: Calendar1Icon,
    keepParams: false,
  },
  {
    title: m.nav_stats,
    url: "/stats",
    icon: ChartColumnIcon,
    keepParams: true,
  },
  {
    title: m.nav_categories,
    url: "/categories",
    icon: TagIcon,
    keepParams: false,
  },
  {
    title: m.nav_payment_methods,
    url: "/payment-methods",
    icon: CreditCardIcon,
    keepParams: false,
  },
  {
    title: m.nav_admin,
    url: "/admin",
    icon: ShieldIcon,
    role: "admin",
    keepParams: false,
  },
  {
    title: m.nav_profile,
    url: "/profile",
    icon: UserCircle2Icon,
    role: "user",
    keepParams: false,
  },
] as const

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const search = useRouterState({ select: (s) => s.location.search })
  const session = authClient.useSession()
  const { isMobile, toggleSidebar } = useSidebar()

  const query = search

  return (
    <Sidebar side="left" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={
                <Link to="/" search={query} onClick={() => isMobile && toggleSidebar()}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-xs bg-primary text-sidebar-primary-foreground">
                    <CalendarSyncIcon className="size-4" />
                  </div>
                  <div className="flex flex-col gap-0.5 leading-none">
                    <span className="font-semibold">Subtracker</span>
                  </div>
                </Link>
              }
            />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.filter((item) =>
                "role" in item ? item.role === session.data?.user.role : true,
              ).map((item) => (
                <SidebarMenuItem key={item.title()}>
                  <SidebarMenuButton
                    isActive={pathname === item.url}
                    render={
                      <Link
                        to={item.url}
                        search={item.keepParams ? query : undefined}
                        onClick={() => isMobile && toggleSidebar()}
                      >
                        <item.icon />
                        <span>{item.title()}</span>
                      </Link>
                    }
                  />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {session.data && (
          <SidebarMenu>
            <SidebarMenuItem>
              <CreateSubscriptionDialog
                trigger={
                  <SidebarMenuButton className="flex">
                    <PlusIcon />
                    <span>{m.nav_add_subscription()}</span>
                  </SidebarMenuButton>
                }
              />
            </SidebarMenuItem>
            <SidebarMenuItem>
              <UserButton />
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
      <SidebarFooter />
    </Sidebar>
  )
}

const NavbarItem = ({
  pathname,
  search,
  ...item
}: (typeof NAV_ITEMS)[number] & {
  pathname: string | null
  search: Record<string, string | string[] | number[]>
}) => (
  <Button
    key={item.title()}
    variant="link"
    className={cn(pathname === item.url ? "text-primary" : "text-foreground")}
    nativeButton={false}
    render={
      <Link
        to={item.url}
        search={item.keepParams ? search : undefined}
        className="flex h-full items-center justify-center gap-2 text-xl font-bold"
      >
        <item.icon className="size-6.5" />
      </Link>
    }
  />
)

export const Navbar = () => {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const search = useRouterState({ select: (s) => s.location.search })

  const navBarItems = NAV_ITEMS.filter((item) => ("role" in item ? item.role === "user" : true))
  return (
    <nav className="fixed right-0 bottom-0 left-0 z-10 flex h-14 items-center justify-between border-t border-border bg-background/80 px-4 backdrop-blur md:hidden md:px-8">
      <div className="grid h-full w-full grid-cols-5 content-center items-center justify-around gap-2">
        {navBarItems
          .filter((_, i) => i < 2)
          .map((item) => (
            <NavbarItem key={item.title()} {...item} pathname={pathname} search={search} />
          ))}
        <CreateSubscriptionDialog
          trigger={
            <Button variant="link" className="flex h-full items-center gap-2 text-foreground">
              <PlusIcon className="size-6.5" />
            </Button>
          }
        />
        {navBarItems
          .filter((_, i) => i >= 2 && i < 3)
          .map((item) => (
            <NavbarItem key={item.title()} {...item} pathname={pathname} search={search} />
          ))}
        <SidebarTrigger className="h-full w-full px-3 py-1.5 [&_svg]:size-6.5!" />
      </div>
    </nav>
  )
}
