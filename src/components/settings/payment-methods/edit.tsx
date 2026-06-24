import { EditIcon } from "lucide-react";
import { useState } from "react";
import { EditCreateForm } from "~/components/settings/payment-methods/edit-create-form";
import { Button } from "~/components/ui/button";
import { VaulDialog } from "~/components/ui/vaul-dialog";
import { m } from "~/paraglide/messages";

type Props = {
	paymentMethod: { id: number; name: string; image: string | null };
};

export const EditPaymentMethodDialog = ({ paymentMethod }: Props) => {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<VaulDialog
			open={isOpen}
			onOpenChange={setIsOpen}
			trigger={
				<Button variant="ghost" className="w-8" size="icon">
					<EditIcon className="size-5" />
				</Button>
			}
			title={m.settings_payment_methods_edit()}
		>
			<EditCreateForm
				onFinished={() => setIsOpen(false)}
				paymentMethod={paymentMethod}
			/>
		</VaulDialog>
	);
};
