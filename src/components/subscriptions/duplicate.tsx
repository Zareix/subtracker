import { EditCreateForm } from "~/components/subscriptions/edit-create-form";
import { WrapperDialogVaul } from "~/components/ui/vaul-dialog";
import { m } from "~/paraglide/messages";
import type { SubscriptionItem } from "~/functions/subscriptions.functions";

type Props = {
  subscription: SubscriptionItem;
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const DuplicateSubscriptionDialog = ({ subscription, isOpen, setIsOpen }: Props) => (
  <WrapperDialogVaul isOpen={isOpen} setIsOpen={setIsOpen}>
    <WrapperDialogVaul.Title>
      {m.subscription_form_duplicate_title({ name: subscription.name })}
    </WrapperDialogVaul.Title>
    <EditCreateForm
      subscription={{ ...subscription, id: undefined }}
      onFinished={() => setIsOpen(false)}
    />
  </WrapperDialogVaul>
);
