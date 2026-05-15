import { useMutation, useQueryClient } from "@tanstack/react-query";
import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { WrapperDialogVaul } from "~/components/ui/vaul-dialog";
import { deleteUser } from "~/functions/users.functions";
import { authClient } from "~/lib/auth-client";
import { m } from "~/paraglide/messages";

export const DeleteUserDialog = ({
	user,
}: {
	user: { id: string; name: string };
}) => {
	const [isOpen, setIsOpen] = useState(false);
	const session = authClient.useSession();
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: () => deleteUser({ data: { id: user.id } }),
		onSuccess: () => {
			toast.success(m.admin_users_deleted());
			queryClient.invalidateQueries({ queryKey: ["users"] });
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
					disabled={session.data?.user.id === user.id}
				>
					<TrashIcon size={20} />
				</Button>
			</WrapperDialogVaul.Trigger>
			<WrapperDialogVaul.Title>
				{m.admin_users_delete()}:{" "}
				<span className="font-medium italic">{user.name}</span>
			</WrapperDialogVaul.Title>
			<WrapperDialogVaul.Description>
				{m.admin_users_delete_confirm()}
			</WrapperDialogVaul.Description>
			<WrapperDialogVaul.Footer>
				<Button
					variant="outline"
					onClick={() => setIsOpen(false)}
					disabled={deleteMutation.isPending}
				>
					{m.subscription_form_cancel()}
				</Button>
				<Button
					variant="destructive"
					onClick={() => deleteMutation.mutate()}
					disabled={deleteMutation.isPending}
				>
					{m.settings_actions_delete()}
				</Button>
			</WrapperDialogVaul.Footer>
		</WrapperDialogVaul>
	);
};
