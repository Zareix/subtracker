import { useNavigate, useSearch } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import { m } from "~/paraglide/messages";

export const SearchBar = () => {
	const search = useSearch({ from: "/_private" });
	const navigate = useNavigate();
	const value = search.search ?? "";

	const setValue = (next: string | null) => {
		navigate({ search: (prev) => ({ ...prev, search: next ?? undefined }) });
	};

	return (
		<div className="relative w-full">
			<Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="search"
				placeholder={m.search_placeholder()}
				value={value}
				onChange={(e) => setValue(e.target.value)}
				className="pr-9 pl-9"
			/>
			<Button
				type="button"
				variant="ghost"
				size="icon"
				onClick={() => setValue(null)}
				className={cn(
					"absolute top-1/2 right-1 h-7 w-7 -translate-y-1/2 transition-opacity",
					value ? "opacity-100" : "pointer-events-none opacity-0",
				)}
			>
				<X className="h-4 w-4" />
				<span className="sr-only">{m.search_clear()}</span>
			</Button>
		</div>
	);
};
