import {
	addMonths,
	endOfMonth,
	isBefore,
	isSameMonth,
	isThisMonth,
} from "date-fns";
import type { SubscriptionItem } from "~/functions/subscriptions.functions";
import type { Filters } from "~/lib/hooks/use-filters";
import { rounded } from "~/lib/utils";

export type BreakdownItem = {
	id: number;
	image: string | null;
	name: string;
	retainPrice: number;
	originalPrice: number;
	currency: string;
};

const getRetainPrice = (
	subscription: SubscriptionItem,
	multiplier: number,
	filters: Pick<Filters, "users">,
): number => {
	const base = filters.users
		? subscription.price / subscription.users.length
		: subscription.price;
	return rounded(base * multiplier);
};

const getScheduleMultiplierMonth = (schedule: string): number => {
	if (schedule === "Monthly") return 1;
	if (schedule === "Quarterly") return 1 / 3;
	if (schedule === "Semiannual") return 1 / 6;
	return 1 / 12;
};

const getScheduleMultiplierYear = (schedule: string): number => {
	if (schedule === "Monthly") return 12;
	if (schedule === "Quarterly") return 4;
	if (schedule === "Semiannual") return 2;
	return 1;
};

export const getStats = (
	subscriptions: SubscriptionItem[],
	filters: Pick<Filters, "users">,
) => {
	const now = new Date();
	const endOfMonthDate = endOfMonth(now);
	const nextMonthDate = addMonths(now, 1);

	const toBreakdown = (
		subs: SubscriptionItem[],
		multiplier: (s: SubscriptionItem) => number,
	): BreakdownItem[] =>
		subs.map((sub) => ({
			id: sub.id,
			image: sub.image,
			name: sub.name,
			retainPrice: getRetainPrice(sub, multiplier(sub), filters),
			originalPrice: sub.originalPrice,
			currency: sub.currency,
		}));

	const sumBreakdown = (items: BreakdownItem[]) =>
		rounded(items.reduce((acc, item) => acc + item.retainPrice, 0));

	const smoothedMonthBreakdown = toBreakdown(subscriptions, (s) =>
		getScheduleMultiplierMonth(s.schedule),
	);

	const smoothedYearBreakdown = toBreakdown(subscriptions, (s) =>
		getScheduleMultiplierYear(s.schedule),
	);

	const thisMonthBreakdown = toBreakdown(
		subscriptions.filter(
			(s) =>
				isThisMonth(s.nextPaymentDate) || isThisMonth(s.previousPaymentDate),
		),
		() => 1,
	);

	const remainingMonthBreakdown = toBreakdown(
		subscriptions.filter((s) => isBefore(s.nextPaymentDate, endOfMonthDate)),
		() => 1,
	);

	const expectedNextMonthBreakdown = toBreakdown(
		subscriptions.filter(
			(s) =>
				isSameMonth(s.nextPaymentDate, nextMonthDate) ||
				isSameMonth(s.secondNextPaymentDate, nextMonthDate),
		),
		() => 1,
	);

	return {
		totalPerMonth: {
			value: sumBreakdown(smoothedMonthBreakdown),
			breakdown: smoothedMonthBreakdown,
		},
		totalPerYear: {
			value: sumBreakdown(smoothedYearBreakdown),
			breakdown: smoothedYearBreakdown,
		},
		totalThisMonth: {
			value: sumBreakdown(thisMonthBreakdown),
			breakdown: thisMonthBreakdown,
		},
		remainingThisMonth: {
			value: sumBreakdown(remainingMonthBreakdown),
			breakdown: remainingMonthBreakdown,
		},
		expectedNextMonth: {
			value: sumBreakdown(expectedNextMonthBreakdown),
			breakdown: expectedNextMonthBreakdown,
		},
	};
};
