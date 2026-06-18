import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { EditCreateForm } from "~/components/admin/users/edit-create-form";
import { Button } from "~/components/ui/button";
import { VaulDialog } from "~/components/ui/vaul-dialog";
import { m } from "~/paraglide/messages";

export const CreateUserDialog = () => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<VaulDialog
			open={isOpen}
			onOpenChange={setIsOpen}
			trigger={
				<Button>
					<PlusIcon size={20} />
					<span>{m.settings_actions_add_new()}</span>
				</Button>
			}
			title={m.admin_users_create()}
		>
			<EditCreateForm onFinished={() => setIsOpen(false)} />
		</VaulDialog>
	);
};
