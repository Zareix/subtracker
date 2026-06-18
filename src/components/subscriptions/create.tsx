import { useState } from "react";
import { EditCreateForm } from "~/components/subscriptions/edit-create-form";
import { VaulDialog } from "~/components/ui/vaul-dialog";
import { m } from "~/paraglide/messages";

export const CreateSubscriptionDialog = ({
	trigger,
}: {
	trigger?: React.ReactNode;
}) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<VaulDialog
			open={isOpen}
			onOpenChange={setIsOpen}
			trigger={trigger}
			title={m.subscription_form_create_title()}
		>
			<EditCreateForm onFinished={() => setIsOpen(false)} />
		</VaulDialog>
	);
};
