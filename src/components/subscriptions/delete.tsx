import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { WrapperDialogVaul } from "~/components/ui/vaul-dialog";
import { deleteSubscription } from "~/functions/subscriptions.functions";
import { m } from "~/paraglide/messages";

export const DeleteDialog = ({
  subscription,
  isOpen,
  setIsOpen,
}: {
  subscription: { id: number; name: string };
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) => {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => deleteSubscription({ data: { id: subscription.id } }),
    onSuccess: () => {
      toast.success(m.subscription_form_delete_success());
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      setIsOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <WrapperDialogVaul isOpen={isOpen} setIsOpen={setIsOpen}>
      <WrapperDialogVaul.Title>
        {m.subscription_form_delete_title()}{" "}
        <span className="font-medium italic">{subscription.name}</span>
      </WrapperDialogVaul.Title>
      <WrapperDialogVaul.Description>
        {m.subscription_form_delete_confirm()}
      </WrapperDialogVaul.Description>
      <WrapperDialogVaul.Footer>
        <Button
          variant="destructive"
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
        >
          {m.subscription_form_delete_action()}
        </Button>
        <Button
          variant="outline"
          onClick={() => setIsOpen(false)}
          disabled={deleteMutation.isPending}
        >
          {m.subscription_form_cancel()}
        </Button>
      </WrapperDialogVaul.Footer>
    </WrapperDialogVaul>
  );
};
