import { EditIcon } from "lucide-react";
import { useState } from "react";
import { EditCreateForm } from "~/components/admin/users/edit-create-form";
import { Button } from "~/components/ui/button";
import { VaulDialog } from "~/components/ui/vaul-dialog";
import { authClient } from "~/lib/auth-client";
import type { UserRole } from "~/lib/constant";
import { m } from "~/paraglide/messages";

type Props = {
	user: {
		id: string;
		name: string;
		email: string;
		image?: string | null;
		role: UserRole;
	};
};

export const EditUserDialog = ({ user }: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	const session = authClient.useSession();

	return (
		<VaulDialog
			open={isOpen}
			onOpenChange={setIsOpen}
			trigger={
				<Button
					variant="ghost"
					className="w-8"
					size="icon"
					disabled={session.data?.user.id === user.id}
				>
					<EditIcon size={20} />
				</Button>
			}
			title={m.admin_users_edit()}
		>
			<EditCreateForm onFinished={() => setIsOpen(false)} user={user} />
		</VaulDialog>
	);
};
