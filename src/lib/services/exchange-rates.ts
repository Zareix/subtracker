import { env } from "~/env";
import {
	Currencies,
	type Currency,
	DEFAULT_BASE_CURRENCY,
} from "~/lib/constant";
import { db, runTransaction } from "~/lib/db";
import { exchangeRates } from "~/lib/db/schema";

type FrankfurterRateResponse = Array<{
	date: string;
	base: string;
	quote: Currency;
	rate: number;
}>;

export const updateExchangeRates = async () => {
	const nonBaseSymbols = Currencies.filter((c) => c !== DEFAULT_BASE_CURRENCY);

	const params = new URLSearchParams({
		base: DEFAULT_BASE_CURRENCY,
		quotes: nonBaseSymbols.join(","),
	}).toString();

	const response = await fetch(
		`${env.FRANKFURTER_API_URL}/v2/rates?${params}`,
		{ method: "GET" },
	);

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(
			`Failed to fetch exchange rates from Frankfurter (${response.status}): ${errorText}`,
		);
	}

	const data = (await response.json()) as FrankfurterRateResponse;

	const ratesMap: Record<Currency, number> = Object.create(null);
	ratesMap[DEFAULT_BASE_CURRENCY] = 1;

	for (const currency of nonBaseSymbols) {
		const row = data.find(
			(item) => item.base === DEFAULT_BASE_CURRENCY && item.quote === currency,
		);
		const rate = row?.rate;

		if (!rate || !Number.isFinite(rate)) {
			throw new Error(
				`Missing or invalid rate for ${currency}. Received: ${String(rate)}`,
			);
		}

		ratesMap[currency] = rate;
	}

	const values: Array<typeof exchangeRates.$inferInsert> = [];
	for (const from of Currencies) {
		for (const to of Currencies) {
			const rateFrom = ratesMap[from];
			const rateTo = ratesMap[to];
			const rate = Math.round((rateTo / rateFrom) * 1e6) / 1e6;
			values.push({ baseCurrency: from, targetCurrency: to, rate });
		}
	}

	await runTransaction(db, async () => {
		await db.delete(exchangeRates);
		await db.insert(exchangeRates).values(values);
	});
};
