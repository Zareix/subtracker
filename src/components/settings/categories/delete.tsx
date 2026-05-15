import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { WrapperDialogVaul } from "~/components/ui/vaul-dialog";
import { deleteCategory } from "~/functions/categories.functions";
import { m } from "~/paraglide/messages";

export const DeleteCategoryDialog = ({
	category,
}: {
	category: { id: number; name: string };
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: () => deleteCategory({ data: { id: category.id } }),
		onSuccess: () => {
			toast.success(m.settings_categories_deleted());
			queryClient.invalidateQueries({ queryKey: ["categories"] });
			setIsOpen(false);
		},
		onError: (err) => toast.error(err.message),
	});

	return (
		<WrapperDialogVaul isOpen={isOpen} setIsOpen={setIsOpen}>
			<WrapperDialogVaul.Trigger>
				<Button
					variant="ghost"
					className="w-8 text-destructive"
					size="icon"
					disabled={category.id === 1}
				>
					<TrashIcon size={20} />
				</Button>
			</WrapperDialogVaul.Trigger>
			<WrapperDialogVaul.Title>
				{m.settings_categories_delete()}:{" "}
				<span className="font-medium italic">{category.name}</span>
			</WrapperDialogVaul.Title>
			<WrapperDialogVaul.Description>
				{m.settings_categories_delete_confirm()}
			</WrapperDialogVaul.Description>
			<WrapperDialogVaul.Footer>
				<Button
					variant="destructive"
					onClick={() => deleteMutation.mutate()}
					disabled={deleteMutation.isPending}
				>
					{m.settings_actions_delete()}
				</Button>
				<Button
					variant="outline"
					onClick={() => setIsOpen(false)}
					disabled={deleteMutation.isPending}
				>
					{m.subscription_form_cancel()}
				</Button>
			</WrapperDialogVaul.Footer>
		</WrapperDialogVaul>
	);
};
