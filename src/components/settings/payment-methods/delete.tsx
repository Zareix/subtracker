import { useMutation, useQueryClient } from "@tanstack/react-query"
import { TrashIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "~/components/ui/button"
import { VaulDialog } from "~/components/ui/vaul-dialog"
import { deletePaymentMethod } from "~/functions/payment-methods.functions"
import { m } from "~/paraglide/messages"

export const DeletePaymentMethodDialog = ({
  paymentMethod,
}: {
  paymentMethod: { id: number; name: string }
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: () => deletePaymentMethod({ data: { id: paymentMethod.id } }),
    onSuccess: () => {
      toast.success(m.settings_payment_methods_deleted())
      queryClient.invalidateQueries({ queryKey: ["paymentMethods"] })
      setIsOpen(false)
    },
    onError: (err) => toast.error(err.message),
  })

  return (
    <VaulDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <Button
          variant="ghost"
          className="w-8 text-destructive"
          size="icon"
          disabled={paymentMethod.id === 1}
        >
          <TrashIcon className="size-5" />
        </Button>
      }
      title={
        <>
          {m.settings_payment_methods_delete()}:{" "}
          <span className="font-medium italic">{paymentMethod.name}</span>
        </>
      }
      description={m.settings_payment_methods_delete_confirm()}
      footer={
        <>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            {m.settings_actions_delete()}
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={deleteMutation.isPending}
          >
            {m.subscription_form_cancel()}
          </Button>
        </>
      }
    />
  )
}
