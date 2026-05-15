import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	Scripts,
	useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Toaster } from "~/components/ui/sonner";
import { ThemeProvider } from "~/components/ui/theme-provider";
import { TooltipProvider } from "~/components/ui/tooltip";
import { getLocale } from "~/paraglide/runtime";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";

import appCss from "../styles.css?url";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async () => {
		if (typeof document !== "undefined") {
			document.documentElement.setAttribute("lang", getLocale());
		}
	},

	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "Subtracker" },
			{ name: "description", content: "Track your subscriptions" },
			{ name: "robots", content: "noindex, nofollow" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),

	shellComponent: RootDocument,
	notFoundComponent: NotFound,
	errorComponent: RootError,
});

function NotFound() {
	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-4">
			<h1 className="font-bold text-4xl">404</h1>
			<p className="text-muted-foreground">Page not found</p>
			<Link to="/" className="text-primary underline underline-offset-4">
				Go home
			</Link>
		</div>
	);
}

function RootError({ error }: { error: unknown }) {
	const router = useRouter();
	const message =
		error instanceof Error ? error.message : "An unexpected error occurred";

	return (
		<div className="flex min-h-svh flex-col items-center justify-center gap-4">
			<h1 className="font-bold text-4xl">Something went wrong</h1>
			<p className="max-w-md text-center text-muted-foreground">{message}</p>
			<button
				type="button"
				onClick={() => router.invalidate()}
				className="text-primary underline underline-offset-4"
			>
				Try again
			</button>
		</div>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang={getLocale()} suppressHydrationWarning>
			<head>
				<HeadContent />
			</head>
			<body>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<TooltipProvider>{children}</TooltipProvider>
				</ThemeProvider>
				<Toaster
					richColors
					toastOptions={{
						className:
							"bg-background/80 backdrop-blur-sm border-border text-foreground",
					}}
				/>
				<TanStackDevtools
					config={{ position: "bottom-right" }}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
						TanStackQueryDevtools,
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
