import { EditIcon } from "lucide-react";
import { useState } from "react";
import { EditCreateForm } from "~/components/settings/payment-methods/edit-create-form";
import { Button } from "~/components/ui/button";
import { WrapperDialogVaul } from "~/components/ui/vaul-dialog";
import { m } from "~/paraglide/messages";

type Props = {
	paymentMethod: { id: number; name: string; image: string | null };
};

export const EditPaymentMethodDialog = ({ paymentMethod }: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<WrapperDialogVaul isOpen={isOpen} setIsOpen={setIsOpen}>
			<WrapperDialogVaul.Trigger>
				<Button variant="ghost" className="w-8" size="icon">
					<EditIcon size={20} />
				</Button>
			</WrapperDialogVaul.Trigger>
			<WrapperDialogVaul.Title>
				{m.settings_payment_methods_edit()}
			</WrapperDialogVaul.Title>
			<EditCreateForm
				onFinished={() => setIsOpen(false)}
				paymentMethod={paymentMethod}
			/>
		</WrapperDialogVaul>
	);
};
