import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { EditCreateForm } from "~/components/settings/payment-methods/edit-create-form";
import { Button } from "~/components/ui/button";
import { WrapperDialogVaul } from "~/components/ui/vaul-dialog";
import { m } from "~/paraglide/messages";

export const CreatePaymentMethodDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <WrapperDialogVaul isOpen={isOpen} setIsOpen={setIsOpen}>
      <WrapperDialogVaul.Trigger>
        <Button>
          <PlusIcon size={20} />
          <span>{m.settings_actions_add_new()}</span>
        </Button>
      </WrapperDialogVaul.Trigger>
      <WrapperDialogVaul.Title>{m.settings_payment_methods_create()}</WrapperDialogVaul.Title>
      <EditCreateForm onFinished={() => setIsOpen(false)} />
    </WrapperDialogVaul>
  );
};
