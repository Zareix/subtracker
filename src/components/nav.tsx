"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
	Calendar1Icon,
	CalendarSyncIcon,
	ChartColumnIcon,
	ChevronsUpDownIcon,
	HomeIcon,
	LanguagesIcon,
	LogOutIcon,
	PlusIcon,
	ShieldIcon,
	UserCircle2Icon,
	WrenchIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { CreateSubscriptionDialog } from "~/components/subscriptions/create";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
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
} from "~/components/ui/dropdown-menu";
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
} from "~/components/ui/sidebar";
import { ThemeIcon } from "~/components/ui/theme-provider";
import { authClient } from "~/lib/auth-client";
import { Currencies, type Currency } from "~/lib/constant";
import { useIsMobile } from "~/lib/hooks/use-mobile";
import { cn, currencyToSymbol } from "~/lib/utils";
import { m } from "~/paraglide/messages";
import { getLocale, setLocale } from "~/paraglide/runtime";

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
		title: m.nav_settings,
		url: "/settings",
		icon: WrenchIcon,
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
] as const;

export function AppSidebar() {
	const locale = getLocale();
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const search = useRouterState({ select: (s) => s.location.search });
	const session = authClient.useSession();
	const { setTheme, theme } = useTheme();
	const queryClient = useQueryClient();
	const isMobile = useIsMobile();
	const { toggleSidebar } = useSidebar();

	const updateBaseCurrencyMutation = useMutation({
		mutationFn: (newCurrency: string) =>
			authClient.updateUser({ baseCurrency: newCurrency as Currency }),
		onSuccess: (res) => {
			if (res.error) {
				toast.error(res.error.message);
				return;
			}
			queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to update currency",
			);
		},
	});

	const handleLocaleChange = (newLocale: "fr" | "en") => {
		setLocale(newLocale);
	};

	const signOut = () => {
		authClient
			.signOut()
			.then(() => {
				navigate({ to: "/login" });
			})
			.catch((error) => {
				toast.error(
					error instanceof Error ? error.message : "Failed to sign out",
				);
			});
	};

	const query = search;

	return (
		<Sidebar side="left" collapsible="icon">
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size="lg"
							render={
								<Link to="/" search={query}>
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
							<DropdownMenu>
								<DropdownMenuTrigger
									render={
										<SidebarMenuButton
											size="lg"
											className="border data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
										>
											<Avatar className="size-8 rounded-lg">
												<AvatarImage
													src={session.data.user.image ?? undefined}
													alt={session.data.user.name ?? ""}
												/>
												<AvatarFallback className="rounded-lg">
													{session.data.user.name.charAt(0).toUpperCase()}
												</AvatarFallback>
											</Avatar>
											<div className="grid flex-1 text-left text-sm leading-tight">
												<span className="truncate font-semibold">
													{session.data.user.name}
												</span>
												<span className="truncate text-xs">
													{session.data.user.email}
												</span>
											</div>
											<ChevronsUpDownIcon className="ml-auto size-4" />
										</SidebarMenuButton>
									}
								/>
								<DropdownMenuContent
									className="min-w-56 rounded-lg"
									side={isMobile ? "top" : "right"}
									align="end"
									sideOffset={4}
								>
									<DropdownMenuGroup>
										<DropdownMenuLabel className="p-0 font-normal">
											<Link
												to="/profile"
												className="flex items-center gap-2 rounded-md px-1 py-1.5 text-left text-sm hover:bg-muted"
												onClick={() => {
													if (isMobile) toggleSidebar();
												}}
											>
												<Avatar className="size-8 rounded-lg">
													<AvatarImage
														src={session.data.user.image ?? undefined}
														alt={session.data.user.name}
													/>
													<AvatarFallback className="rounded-lg">
														{session.data.user.name.charAt(0).toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<div className="grid flex-1 text-left text-sidebar-accent-foreground text-sm leading-tight">
													<span className="truncate font-semibold">
														{session.data.user.name}
													</span>
													<span className="truncate text-xs">
														{session.data.user.email}
													</span>
												</div>
											</Link>
										</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuSub>
											<DropdownMenuSubTrigger>
												<ThemeIcon theme={theme} />
												{m.nav_theme()}
											</DropdownMenuSubTrigger>
											<DropdownMenuPortal>
												<DropdownMenuSubContent>
													<DropdownMenuRadioGroup
														value={theme}
														onValueChange={(value) => setTheme(value)}
													>
														<DropdownMenuRadioItem
															value="light"
															className="flex items-center gap-2"
														>
															<ThemeIcon theme="light" />
															{m.nav_theme_light()}
														</DropdownMenuRadioItem>
														<DropdownMenuRadioItem
															value="dark"
															className="flex items-center gap-2"
														>
															<ThemeIcon theme="dark" />
															{m.nav_theme_dark()}
														</DropdownMenuRadioItem>
														<DropdownMenuRadioItem
															value="system"
															className="flex items-center gap-2"
														>
															<ThemeIcon theme="system" />
															{m.nav_theme_system()}
														</DropdownMenuRadioItem>
													</DropdownMenuRadioGroup>
												</DropdownMenuSubContent>
											</DropdownMenuPortal>
										</DropdownMenuSub>
										<DropdownMenuSub>
											<DropdownMenuSubTrigger>
												<span className="mr-2">
													{currencyToSymbol(session.data.user.baseCurrency)}
												</span>
												{m.nav_currency()}
											</DropdownMenuSubTrigger>
											<DropdownMenuPortal>
												<DropdownMenuSubContent className="max-h-64 overflow-auto">
													<DropdownMenuRadioGroup
														value={
															(session.data.user.baseCurrency as string) ??
															"USD"
														}
														onValueChange={(value) =>
															updateBaseCurrencyMutation.mutate(
																value as Currency,
															)
														}
													>
														{Currencies.map((currency) => (
															<DropdownMenuRadioItem
																key={currency}
																value={currency}
																className="flex items-center gap-2 capitalize"
															>
																{currencyToSymbol(currency)} {currency}
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
													<DropdownMenuRadioGroup
														value={locale}
														onValueChange={handleLocaleChange}
													>
														<DropdownMenuRadioItem
															value="en"
															className="flex items-center gap-2"
														>
															{m.nav_language_en()}
														</DropdownMenuRadioItem>
														<DropdownMenuRadioItem
															value="fr"
															className="flex items-center gap-2"
														>
															{m.nav_language_fr()}
														</DropdownMenuRadioItem>
													</DropdownMenuRadioGroup>
												</DropdownMenuSubContent>
											</DropdownMenuPortal>
										</DropdownMenuSub>
										<DropdownMenuItem onClick={signOut}>
											<LogOutIcon />
											{m.nav_log_out()}
										</DropdownMenuItem>
									</DropdownMenuGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</SidebarMenuItem>
					</SidebarMenu>
				)}
			</SidebarFooter>
			<SidebarFooter />
		</Sidebar>
	);
}

const NavbarItem = ({
	pathname,
	search,
	...item
}: (typeof NAV_ITEMS)[number] & {
	pathname: string | null;
	search: Record<string, string | string[] | number[]>;
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
				className="flex h-full items-center justify-center gap-2 font-bold text-xl"
			>
				<item.icon size={26} />
			</Link>
		}
	/>
);

export const Navbar = () => {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const search = useRouterState({ select: (s) => s.location.search });

	const navBarItems = NAV_ITEMS.filter((item) =>
		"role" in item ? item.role === "user" : true,
	);
	const middleIndex = Math.floor(navBarItems.length / 2);
	return (
		<nav className="fixed right-0 bottom-0 left-0 z-10 flex h-14 items-center justify-between border-border border-t bg-background/80 px-4 backdrop-blur md:hidden md:px-8">
			<div className="grid h-full w-full grid-cols-5 content-center items-center justify-around gap-2">
				{navBarItems
					.filter((_, i) => i < middleIndex)
					.map((item) => (
						<NavbarItem
							key={item.title()}
							{...item}
							pathname={pathname}
							search={search}
						/>
					))}
				<CreateSubscriptionDialog
					trigger={
						<Button
							variant="link"
							className="flex h-full items-center gap-2 text-foreground"
						>
							<PlusIcon />
						</Button>
					}
				/>
				{navBarItems
					.filter((_, i) => i >= middleIndex && i < 3)
					.map((item) => (
						<NavbarItem
							key={item.title()}
							{...item}
							pathname={pathname}
							search={search}
						/>
					))}
				<SidebarTrigger className="h-full w-full px-3 py-1.5 [&_svg]:size-6.5" />
			</div>
		</nav>
	);
};
