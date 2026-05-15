import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import { iconNames } from "lucide-react/dynamic.mjs";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { CategoryIcon } from "~/components/subscriptions/categories/icon";
import { Button } from "~/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "~/components/ui/command";
import { DialogFooter } from "~/components/ui/dialog";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "~/components/ui/popover";
import { createCategory, editCategory } from "~/functions/categories.functions";
import { cn } from "~/lib/utils";
import { m } from "~/paraglide/messages";

const schema = z.object({
	name: z.string().min(1),
	icon: z.string().min(1),
});

type CategoryItem = { id: number; name: string; icon: string | null };

export const EditCreateForm = ({
	category,
	onFinished,
}: {
	category?: CategoryItem;
	onFinished?: () => void;
}) => {
	const queryClient = useQueryClient();
	const [iconSearch, setIconSearch] = useState("");

	const filteredIconNames = iconNames
		.filter((name) => {
			if (!iconSearch) return false;
			return name.toLowerCase().includes(iconSearch.toLowerCase());
		})
		.toSorted((a, b) => a.localeCompare(b))
		.slice(0, 30);

	const createMutation = useMutation({
		mutationFn: (data: z.infer<typeof schema>) => createCategory({ data }),
		onSuccess: () => {
			toast.success(m.settings_categories_created());
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			onFinished?.();
		},
		onError: (err) => toast.error(err.message),
	});

	const editMutation = useMutation({
		mutationFn: (data: z.infer<typeof schema> & { id: number }) =>
			editCategory({ data }),
		onSuccess: () => {
			toast.success(m.settings_categories_edited());
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			onFinished?.();
		},
		onError: (err) => toast.error(err.message),
	});

	const form = useForm({
		defaultValues: {
			name: category?.name ?? "",
			icon: category?.icon ?? "",
		},
		onSubmit: async ({ value }) => {
			const parsed = schema.safeParse(value);
			if (!parsed.success) return;
			if (category) {
				editMutation.mutate({ ...parsed.data, id: category.id });
			} else {
				createMutation.mutate(parsed.data);
			}
		},
	});

	const isPending = createMutation.isPending || editMutation.isPending;

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
		>
			<FieldGroup>
				<form.Field name="name">
					{(field) => (
						<Field data-invalid={field.state.meta.errors.length > 0}>
							<FieldLabel htmlFor="category-name">
								{m.settings_form_name()}
							</FieldLabel>
							<Input
								id="category-name"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
								placeholder={m.settings_categories_name_placeholder()}
							/>
							{field.state.meta.errors.length > 0 && (
								<FieldError
									errors={field.state.meta.errors.map((e) => ({
										message: String(e),
									}))}
								/>
							)}
						</Field>
					)}
				</form.Field>

				<form.Field name="icon">
					{(field) => (
						<Field
							data-invalid={field.state.meta.errors.length > 0}
							className="flex flex-col"
						>
							<FieldLabel htmlFor="category-icon">
								{m.settings_icon_label()}
							</FieldLabel>
							<div className="flex items-center gap-2">
								{field.state.value && <CategoryIcon icon={field.state.value} />}
								<Popover modal>
									<PopoverTrigger
										render={
											<Button
												id="category-icon"
												variant="outline"
												className={cn(
													"h-10 grow justify-between",
													!field.state.value && "text-muted-foreground",
												)}
											>
												{field.state.value
													? iconNames.find((name) => name === field.state.value)
													: m.settings_icon_select()}
												<ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
											</Button>
										}
									/>
									<PopoverContent className="w-50 p-0">
										<Command shouldFilter={false}>
											<CommandInput
												placeholder={m.settings_icon_search()}
												onValueChange={setIconSearch}
											/>
											<CommandList>
												<CommandEmpty>
													{!iconSearch
														? m.settings_icon_search_for()
														: m.settings_icon_no_results()}
												</CommandEmpty>
												<CommandGroup>
													{filteredIconNames.map((name) => (
														<CommandItem
															value={name}
															key={name}
															onSelect={() => field.handleChange(name)}
														>
															{name && <CategoryIcon icon={name} />}
															{name}
															<CheckIcon
																className={cn(
																	"ml-auto",
																	name === field.state.value
																		? "opacity-100"
																		: "opacity-0",
																)}
															/>
														</CommandItem>
													))}
												</CommandGroup>
											</CommandList>
										</Command>
									</PopoverContent>
								</Popover>
							</div>
							<FieldDescription>
								{m.settings_icon_find_on()}{" "}
								<a
									href="https://lucide.dev/icons/?focus"
									target="_blank"
									rel="noreferrer"
									className="text-blue-500 underline"
								>
									lucide.dev
								</a>
							</FieldDescription>
							{field.state.meta.errors.length > 0 && (
								<FieldError
									errors={field.state.meta.errors.map((e) => ({
										message: String(e),
									}))}
								/>
							)}
						</Field>
					)}
				</form.Field>

				<DialogFooter>
					<Button type="submit" disabled={isPending}>
						{isPending ? "..." : m.settings_form_submit()}
					</Button>
				</DialogFooter>
			</FieldGroup>
		</form>
	);
};
