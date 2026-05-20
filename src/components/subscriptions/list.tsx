import { compareAsc, endOfToday, isBefore, isThisMonth } from "date-fns";
import {
	Calendar1Icon,
	CopyPlusIcon,
	EditIcon,
	ExternalLinkIcon,
	InfoIcon,
	RefreshCcwIcon,
	TextIcon,
	TrashIcon,
	UserIcon,
	WalletCardsIcon,
} from "lucide-react";
import React, { useState } from "react";
import { CategoryIcon } from "~/components/subscriptions/categories/icon";
import { DeleteDialog } from "~/components/subscriptions/delete";
import { DuplicateSubscriptionDialog } from "~/components/subscriptions/duplicate";
import { EditSubscriptionDialog } from "~/components/subscriptions/edit";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Separator } from "~/components/ui/separator";
import type { SubscriptionItem } from "~/functions/subscriptions.functions";
import { authClient } from "~/lib/auth-client";
import { type Currencies, DEFAULT_BASE_CURRENCY } from "~/lib/constant";
import { useFilters } from "~/lib/hooks/use-filters";
import { useSort } from "~/lib/hooks/use-sort";
import {
	cn,
	currencyToSymbol,
	formatNextPaymentDate,
	getFilteredSubscriptions,
	getSortedSubscriptions,
} from "~/lib/utils";
import { m } from "~/paraglide/messages";

type Subscription = SubscriptionItem;

type Props = {
	subscriptions: Subscription[];
};

const SCHEDULE_LABELS: Record<Subscription["schedule"], () => string> = {
	Monthly: m.schedule_monthly,
	Quarterly: m.schedule_quarterly,
	Semiannual: m.schedule_semiannual,
	Yearly: m.schedule_yearly,
};

export const SubscriptionList = ({ subscriptions }: Props) => {
	const [filters] = useFilters();
	const [sort] = useSort();
	const { data: session } = authClient.useSession();
	const [arePreviousPaymentsShown, setArePreviousPaymentsShown] =
		useState(false);

	const userBaseCurrency =
		(session?.user?.baseCurrency as (typeof Currencies)[number]) ??
		DEFAULT_BASE_CURRENCY;

	const subs = getFilteredSubscriptions(
		getSortedSubscriptions(subscriptions, sort),
		filters,
	);

	if (subs.length === 0) {
		return (
			<div className="text-center text-muted-foreground">
				{m.subscription_list_empty()}
			</div>
		);
	}

	const now = endOfToday();
	const previousSubOfThisMonth = subs
		.filter(
			(s) =>
				isThisMonth(s.previousPaymentDate) &&
				isBefore(s.previousPaymentDate, now),
		)
		.toSorted((a, b) =>
			compareAsc(a.previousPaymentDate, b.previousPaymentDate),
		);

	return (
		<>
			{arePreviousPaymentsShown &&
				previousSubOfThisMonth.map((subscription, i) => (
					<React.Fragment key={subscription.id}>
						<SubscriptionListItem
							subscription={subscription}
							userBaseCurrency={userBaseCurrency}
							isPrevious
						/>
						{i < previousSubOfThisMonth.length - 1 && (
							<Separator className="w-full h-px" />
						)}
					</React.Fragment>
				))}
			{previousSubOfThisMonth.length > 0 && (
				<div className="mx-auto flex max-w-[90vw] items-center justify-center overflow-x-hidden">
					<Separator className="w-32 h-px" />
					<Button
						variant="outline"
						size="sm"
						onClick={() => setArePreviousPaymentsShown((v) => !v)}
					>
						{arePreviousPaymentsShown
							? m.subscription_list_hide_previous()
							: m.subscription_list_show_previous()}
					</Button>
					<Separator className="w-32 h-px" />
				</div>
			)}
			{subs.map((subscription) => (
				<React.Fragment key={subscription.id}>
					<SubscriptionListItem
						subscription={subscription}
						userBaseCurrency={userBaseCurrency}
					/>
					<Separator className="w-full h-px" />
				</React.Fragment>
			))}
		</>
	);
};

const SubscriptionListItem = ({
	subscription,
	userBaseCurrency,
	isPrevious = false,
}: {
	subscription: Subscription;
	userBaseCurrency: string;
	isPrevious?: boolean;
}) => {
	const [filters, setFilters] = useFilters();
	const [isOpen, setIsOpen] = useState({
		delete: false,
		edit: false,
		duplicate: false,
	});

	return (
		<Card
			className={cn(
				"border-none from-card shadow-none ring-transparent",
				isPrevious && "opacity-50",
			)}
		>
			<CardContent className="py-4">
				<div className="flex items-center gap-2">
					{subscription.image && (
						<img
							src={subscription.image}
							alt={subscription.name}
							width={64}
							height={48}
							className="max-h-12 max-w-10 object-contain md:max-w-16"
						/>
					)}
					<div className="flex grow flex-col gap-1">
						<h2 className="font-semibold text-xl">{subscription.name}</h2>
						<div className="flex items-center gap-1 text-muted-foreground text-sm">
							<Calendar1Icon size={16} />
							{formatNextPaymentDate(
								isPrevious
									? subscription.previousPaymentDate
									: subscription.nextPaymentDate,
							)}
						</div>
					</div>
					<div className="text-lg">
						{subscription.price}
						{currencyToSymbol(userBaseCurrency)}
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button
									size="icon"
									variant="ghost"
									className="w-5 text-muted-foreground md:w-10"
								>
									<InfoIcon size={20} />
								</Button>
							}
						/>
						<DropdownMenuContent
							className="mr-2 w-32"
							onClick={(e) => e.stopPropagation()}
						>
							<DropdownMenuItem
								onClick={() => setIsOpen({ ...isOpen, edit: true })}
							>
								<EditIcon />
								<span>{m.subscription_list_edit()}</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => setIsOpen({ ...isOpen, duplicate: true })}
							>
								<CopyPlusIcon />
								<span>{m.subscription_list_duplicate()}</span>
							</DropdownMenuItem>
							<DropdownMenuItem
								className="text-destructive"
								onClick={() => setIsOpen({ ...isOpen, delete: true })}
							>
								<TrashIcon />
								<span>{m.subscription_list_delete()}</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<div className="flex flex-wrap gap-x-4 gap-y-2 pt-1 text-base text-foreground/80 md:gap-x-6">
					<div className="flex items-center gap-1">
						<UserIcon size={18} className="text-primary" />
						<span>{subscription.users.map((u) => u.name).join(", ")}</span>
					</div>
					<button
						type="button"
						className="flex items-center gap-1"
						onClick={() =>
							setFilters({
								paymentMethods:
									filters.paymentMethods.length > 1
										? filters.paymentMethods
										: filters.paymentMethods[0] ===
												subscription.paymentMethod.id
											? undefined
											: [subscription.paymentMethod.id],
							})
						}
					>
						{subscription.paymentMethod.image ? (
							<img
								src={subscription.paymentMethod.image}
								alt={subscription.paymentMethod.name}
								width={20}
								height={20}
								className="max-h-5 max-w-5 object-contain"
							/>
						) : (
							<WalletCardsIcon size={18} className="text-primary" />
						)}
						<span>{subscription.paymentMethod.name}</span>
					</button>
					<button
						type="button"
						className="flex items-center gap-1"
						onClick={() =>
							setFilters({
								categories:
									filters.categories.length > 1
										? filters.categories
										: filters.categories[0] === subscription.category.id
											? undefined
											: [subscription.category.id],
							})
						}
					>
						<CategoryIcon
							icon={subscription.category.icon}
							size={16}
							className="text-primary"
						/>
						{subscription.category.name}
					</button>
					<button
						type="button"
						className="flex items-center gap-1"
						onClick={() =>
							setFilters({
								schedule:
									filters.schedule === subscription.schedule
										? null
										: subscription.schedule,
							})
						}
					>
						<RefreshCcwIcon size={16} className="text-primary" />
						{SCHEDULE_LABELS[subscription.schedule]()}
					</button>
					{subscription.currency !== userBaseCurrency && (
						<div className="flex items-center gap-0.5">
							<span className="text-primary">
								{currencyToSymbol(subscription.currency)}
							</span>
							{subscription.originalPrice}
						</div>
					)}
					{subscription.url && (
						<a
							href={subscription.url}
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-1"
						>
							<ExternalLinkIcon size={16} className="text-primary" />
							{new URL(subscription.url).hostname}
						</a>
					)}
					{subscription.description.length > 0 && (
						<div className="flex items-center gap-1">
							<TextIcon size={20} className="text-primary" />
							<span className="max-w-[80vw] overflow-x-clip text-ellipsis whitespace-nowrap md:whitespace-pre-wrap">
								{subscription.description}
							</span>
						</div>
					)}
				</div>
				<DeleteDialog
					subscription={subscription}
					isOpen={isOpen.delete}
					setIsOpen={() => setIsOpen({ ...isOpen, delete: false })}
				/>
				<EditSubscriptionDialog
					subscription={subscription}
					isOpen={isOpen.edit}
					setIsOpen={() => setIsOpen({ ...isOpen, edit: false })}
				/>
				<DuplicateSubscriptionDialog
					subscription={subscription}
					isOpen={isOpen.duplicate}
					setIsOpen={() => setIsOpen({ ...isOpen, duplicate: false })}
				/>
			</CardContent>
		</Card>
	);
};
