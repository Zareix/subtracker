import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerTitle,
  DrawerTrigger,
} from "~/components/ui/drawer"
import { useIsMobile } from "~/lib/hooks/use-mobile"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  children?: React.ReactNode
  trigger?: React.ReactElement
  title?: React.ReactNode
  description?: React.ReactNode
  footer?: React.ReactNode
}

export const VaulDialog = ({
  open,
  onOpenChange,
  children,
  trigger,
  title,
  description,
  footer,
}: Props) => {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} repositionInputs={false}>
        {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
        <DrawerContent aria-describedby={undefined}>
          {title && <DrawerTitle>{title}</DrawerTitle>}
          {children}
          {description && <DrawerDescription>{description}</DrawerDescription>}
          {footer && <DrawerFooter>{footer}</DrawerFooter>}
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto" aria-describedby={undefined}>
        {title && <DialogTitle>{title}</DialogTitle>}
        {children}
        {description && <DialogDescription>{description}</DialogDescription>}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  )
}
