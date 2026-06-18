import { EditIcon } from "lucide-react";
import { useState } from "react";
import { EditCreateForm } from "~/components/settings/categories/edit-create-form";
import { Button } from "~/components/ui/button";
import { VaulDialog } from "~/components/ui/vaul-dialog";
import { m } from "~/paraglide/messages";

type Props = {
	category: { id: number; name: string; icon: string | null };
};

export const EditCategoryDialog = ({ category }: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<VaulDialog
			open={isOpen}
			onOpenChange={setIsOpen}
			trigger={
				<Button variant="ghost" className="w-8" size="icon">
					<EditIcon size={20} />
				</Button>
			}
			title={m.settings_categories_edit()}
		>
			<EditCreateForm onFinished={() => setIsOpen(false)} category={category} />
		</VaulDialog>
	);
};
