import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { authClient } from "~/lib/auth-client";
import { CURRENCY_SYMBOLS, Currencies, type Currency } from "~/lib/constant";
import { m } from "~/paraglide/messages";

export const CurrencySettings = () => {
	const { data: session, isPending: isSessionLoading } =
		authClient.useSession();
	const user = session?.user;

	const updateCurrencyMutation = useMutation({
		mutationFn: (newCurrency: Currency) =>
			authClient.updateUser({ baseCurrency: newCurrency }),
		onSuccess: (res) => {
			if (res.error) {
				toast.error(res.error.message);
				return;
			}
			toast.success(m.profile_currency_updated_success());
		},
		onError: (err) =>
			toast.error(err.message ?? m.profile_currency_update_failed()),
	});

	if (isSessionLoading || !user) {
		return (
			<section>
				<h2 className="mb-4 font-bold text-2xl">
					{m.profile_currency_title()}
				</h2>
				<div className="animate-pulse">
					<div className="mb-2 h-4 w-32 rounded bg-gray-200" />
					<div className="h-10 w-full rounded bg-gray-200" />
				</div>
			</section>
		);
	}

	const currencies = Currencies.map((currency) => ({
		value: currency,
		label: `${CURRENCY_SYMBOLS[currency]} ${m[`currency_${currency}`]()}`,
	}));

	return (
		<section>
			<h2 className="mb-4 font-bold text-2xl">{m.profile_currency_title()}</h2>
			<Select
				value={user.baseCurrency}
				onValueChange={(value) =>
					updateCurrencyMutation.mutate(value as Currency)
				}
				items={currencies}
			>
				<SelectTrigger className="min-w-42.5 capitalize">
					<SelectValue placeholder={m.profile_currency_select()} />
				</SelectTrigger>
				<SelectContent>
					{currencies.map((currency) => (
						<SelectItem key={currency.value} value={currency.value}>
							{currency.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</section>
	);
};
