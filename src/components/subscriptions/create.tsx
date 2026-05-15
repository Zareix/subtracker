import { useState } from "react";
import { EditCreateForm } from "~/components/subscriptions/edit-create-form";
import { WrapperDialogVaul } from "~/components/ui/vaul-dialog";
import { m } from "~/paraglide/messages";

export const CreateSubscriptionDialog = ({
	trigger,
}: {
	trigger?: React.ReactNode;
}) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<WrapperDialogVaul isOpen={isOpen} setIsOpen={setIsOpen}>
			<WrapperDialogVaul.Trigger>{trigger}</WrapperDialogVaul.Trigger>
			<WrapperDialogVaul.Title>
				{m.subscription_form_create_title()}
			</WrapperDialogVaul.Title>
			<EditCreateForm onFinished={() => setIsOpen(false)} />
		</WrapperDialogVaul>
	);
};
