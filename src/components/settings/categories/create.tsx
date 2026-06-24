import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { EditCreateForm } from "~/components/settings/categories/edit-create-form";
import { Button } from "~/components/ui/button";
import { VaulDialog } from "~/components/ui/vaul-dialog";
import { m } from "~/paraglide/messages";

export const CreateCategoryDialog = () => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<VaulDialog
			open={isOpen}
			onOpenChange={setIsOpen}
			trigger={
				<Button>
					<PlusIcon className="size-5" />
					<span>{m.settings_actions_add_new()}</span>
				</Button>
			}
			title={m.settings_categories_create()}
		>
			<EditCreateForm onFinished={() => setIsOpen(false)} />
		</VaulDialog>
	);
};
