import { SortAscIcon, SortDescIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { SORTS, type Sort } from "~/lib/constant";
import { useSort } from "~/lib/hooks/use-sort";
import { cn } from "~/lib/utils";
import { m } from "~/paraglide/messages";

const SORT_LABELS: Record<Sort, () => string> = {
	PRICE_ASC: m.sort_price_low_to_high,
	PRICE_DESC: m.sort_price_high_to_low,
	NEXT_PAYMENT_DATE: m.sort_next_payment_date,
};

export const SortButton = () => {
	const [sort, setSort] = useSort();

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button variant="ghost" size="icon-lg">
						{sort?.endsWith("ASC") ? (
							<SortAscIcon
								className={cn(
									sort ? "fill-primary text-primary" : "text-foreground",
								)}
							/>
						) : (
							<SortDescIcon
								className={cn(
									sort ? "fill-primary text-primary" : "text-foreground",
								)}
							/>
						)}
					</Button>
				}
			/>
			<DropdownMenuContent className="w-56">
				<DropdownMenuGroup>
					<DropdownMenuLabel>{m.sort_label()}</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuRadioGroup
						value={sort ?? ""}
						onValueChange={(v) => setSort(v === sort ? null : (v as Sort))}
					>
						{SORTS.map((s) => (
							<DropdownMenuRadioItem
								key={s.key}
								value={s.key}
								className="capitalize"
							>
								{SORT_LABELS[s.key]()}
							</DropdownMenuRadioItem>
						))}
					</DropdownMenuRadioGroup>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};
