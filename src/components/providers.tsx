import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { ThemeProvider, useTheme } from "next-themes";
import { TooltipProvider } from "~/components/ui/tooltip";
import { getSocialProviders } from "~/functions/users.functions";
import { apiKeyPlugin } from "~/lib/auth/api-key-plugin";
import { passkeyPlugin } from "~/lib/auth/passkey-plugin";
import { themePlugin } from "~/lib/auth/theme-plugin";
import { authClient } from "~/lib/auth-client";
import { Currencies } from "~/lib/constant";
import { currencyToSymbol } from "~/lib/utils";
import { m } from "~/paraglide/messages";
import { AuthProvider } from "./auth/auth-provider";

export const Providers = ({ children }: { children: React.ReactNode }) => {
	const navigate = useNavigate();
	const providersQuery = useQuery({
		queryKey: ["social-providers"],
		queryFn: () => getSocialProviders(),
	});

	return (
		<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
			<TooltipProvider>
				{providersQuery.isLoading ? null : providersQuery.isError ? (
					<div>Could not load providers.</div>
				) : (
					<AuthProvider
						authClient={authClient}
						redirectTo="/"
						socialProviders={providersQuery.data ?? []}
						navigate={navigate}
						plugins={[
							passkeyPlugin(),
							apiKeyPlugin(),
							themePlugin({ useTheme }),
						]}
						additionalFields={[
							{
								name: "baseCurrency",
								type: "string",
								label: "Currency",
								inputType: "select",
								options: Currencies.map((currency) => ({
									value: currency,
									label: `${currencyToSymbol(currency)} ${m[`currency_${currency}`]()}`,
								})),
								required: true,
							},
						]}
						Link={Link}
					>
						{children}
					</AuthProvider>
				)}
			</TooltipProvider>
		</ThemeProvider>
	);
};
