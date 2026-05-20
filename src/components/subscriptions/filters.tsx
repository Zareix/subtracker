import { useQuery } from "@tanstack/react-query";
import { FilterIcon } from "lucide-react";
import { CategoryIcon } from "~/components/subscriptions/categories/icon";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
	Popover,
	PopoverContent,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "~/components/ui/popover";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { getCategories } from "~/functions/categories.functions";
import { getPaymentMethods } from "~/functions/payment-methods.functions";
import { getUsers } from "~/functions/users.functions";
import { SCHEDULES, type Schedule } from "~/lib/constant";
import { type Filters, useFilters } from "~/lib/hooks/use-filters";
import { cn } from "~/lib/utils";
import { m } from "~/paraglide/messages";

const SCHEDULE_LABELS: Record<Schedule, () => string> = {
	Monthly: m.schedule_monthly,
	Quarterly: m.schedule_quarterly,
	Semiannual: m.schedule_semiannual,
	Yearly: m.schedule_yearly,
};

type Props = {
	filtersDisplayed?: Array<keyof Filters>;
};

export const FiltersButton = ({
	filtersDisplayed = ["paymentMethods", "schedule", "users", "categories"],
}: Props) => {
	const [filters, setFilters] = useFilters();
	const usersQuery = useQuery({
		queryKey: ["users"],
		queryFn: () => getUsers(),
	});
	const paymentMethodsQuery = useQuery({
		queryKey: ["paymentMethods"],
		queryFn: () => getPaymentMethods(),
	});
	const categoriesQuery = useQuery({
		queryKey: ["categories"],
		queryFn: () => getCategories(),
	});

	if (
		usersQuery.isError ||
		paymentMethodsQuery.isError ||
		categoriesQuery.isError
	) {
		return null;
	}

	const paymentMethods = (paymentMethodsQuery.data ?? []).map((p) => ({
		value: p.id,
		label: (
			<div className="flex items-center gap-1">
				{p.image && (
					<img
						src={p.image}
						alt={p.name}
						width={20}
						height={20}
						className="max-h-5 max-w-5 object-contain"
					/>
				)}
				{p.name}
			</div>
		),
	}));
	const users = (usersQuery.data ?? []).map((u) => ({
		value: u.id,
		label: (
			<div className="flex items-center gap-1">
				{u.image && (
					<img
						src={u.image}
						alt={u.name}
						width={20}
						height={20}
						className="max-h-5 max-w-5 object-contain"
					/>
				)}
				{u.name}
			</div>
		),
	}));
	const categories = (categoriesQuery.data ?? []).map((c) => ({
		value: c.id,
		label: (
			<div className="flex items-center gap-1">
				{c.icon && (
					<CategoryIcon
						icon={c.icon}
						className="max-h-5 max-w-5 object-contain"
					/>
				)}
				{c.name}
			</div>
		),
	}));
	const schedules = SCHEDULES.map((s) => ({
		value: s,
		label: SCHEDULE_LABELS[s](),
	}));

	const hasActiveFilters =
		!!filters.schedule ||
		!!filters.users ||
		filters.paymentMethods.length > 0 ||
		filters.categories.length > 0;

	return (
		<div className="flex items-center gap-4">
			<Popover>
				<PopoverTrigger
					render={
						<Button
							size="icon-lg"
							variant="ghost"
							disabled={
								usersQuery.isLoading ||
								paymentMethodsQuery.isLoading ||
								categoriesQuery.isLoading
							}
						>
							<FilterIcon
								className={cn(
									hasActiveFilters
										? "fill-primary text-primary"
										: "text-foreground",
								)}
							/>
						</Button>
					}
				/>
				<PopoverContent className="mr-3 w-fit min-w-50 gap-0 p-0">
					<PopoverHeader className="gap-0 border-b px-3 py-2">
						<PopoverTitle className="font-medium text-muted-foreground text-xs">
							{m.filters_label()}
						</PopoverTitle>
					</PopoverHeader>
					<div className="flex flex-col gap-2 p-3 pt-1">
						{filtersDisplayed.includes("users") && (
							<>
								<Label htmlFor="filters-users" className="mt-2">
									{m.filters_users()}
								</Label>
								<Select
									id="filters-users"
									onValueChange={(value) =>
										setFilters({
											users: filters.users === value ? null : value,
										})
									}
									value={filters.users ?? ""}
									items={users}
								>
									<SelectTrigger className="w-full capitalize">
										<SelectValue placeholder={m.filters_select()} />
									</SelectTrigger>
									<SelectContent>
										{users.map((user) => (
											<SelectItem value={user.value} key={user.value}>
												{user.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</>
						)}
						{filtersDisplayed.includes("schedule") && (
							<>
								<Label htmlFor="filters-schedule" className="mt-2">
									{m.filters_schedule()}
								</Label>
								<Select
									id="filters-schedule"
									onValueChange={(value) =>
										setFilters({
											schedule:
												filters.schedule === value ? null : (value as Schedule),
										})
									}
									value={filters.schedule ?? ""}
									items={schedules}
								>
									<SelectTrigger className="w-full capitalize">
										<SelectValue placeholder={m.filters_select()} />
									</SelectTrigger>
									<SelectContent>
										{schedules.map((schedule) => (
											<SelectItem value={schedule.value} key={schedule.value}>
												{schedule.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</>
						)}
						{filtersDisplayed.includes("paymentMethods") && (
							<>
								<Label htmlFor="filters-paymentMethods" className="mt-2">
									{m.filters_payment_methods()}
								</Label>
								<Select
									id="filters-paymentMethods"
									onValueChange={(value) =>
										setFilters({
											paymentMethods: value.length === 0 ? undefined : value,
										})
									}
									value={filters.paymentMethods}
									multiple
									items={paymentMethods}
								>
									<SelectTrigger className="w-full capitalize">
										<SelectValue placeholder={m.filters_select()} />
									</SelectTrigger>
									<SelectContent>
										{paymentMethods.map((pm) => (
											<SelectItem value={pm.value} key={pm.value}>
												{pm.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</>
						)}
						{filtersDisplayed.includes("categories") && (
							<>
								<Label htmlFor="filters-categories" className="mt-2">
									{m.filters_categories()}
								</Label>
								<Select
									id="filters-categories"
									onValueChange={(value) =>
										setFilters({
											categories: value.length === 0 ? undefined : value,
										})
									}
									value={filters.categories}
									multiple
									items={categories}
								>
									<SelectTrigger className="w-full capitalize">
										<SelectValue placeholder={m.filters_select()} />
									</SelectTrigger>
									<SelectContent>
										{categories.map((cat) => (
											<SelectItem value={cat.value} key={cat.value}>
												{cat.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</>
						)}
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
};
