import { EditCreateForm } from "~/components/subscriptions/edit-create-form";
import { WrapperDialogVaul } from "~/components/ui/vaul-dialog";
import type { SubscriptionItem } from "~/functions/subscriptions.functions";
import { m } from "~/paraglide/messages";

type Props = {
	subscription: SubscriptionItem;
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const EditSubscriptionDialog = ({
	subscription,
	isOpen,
	setIsOpen,
}: Props) => (
	<WrapperDialogVaul isOpen={isOpen} setIsOpen={setIsOpen}>
		<WrapperDialogVaul.Title>
			{m.subscription_form_edit_title({ name: subscription.name })}
		</WrapperDialogVaul.Title>
		<EditCreateForm
			subscription={subscription}
			onFinished={() => setIsOpen(false)}
		/>
	</WrapperDialogVaul>
);
