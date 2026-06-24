import { NumberField as PrimitiveNumberField } from "@base-ui/react"
import { MinusIcon, PlusIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "~/lib/utils"

function NumberField({
  showSteppers,
  className,
  ...props
}: PrimitiveNumberField.Root.Props & {
  showSteppers?: boolean
}) {
  return (
    <PrimitiveNumberField.Root {...props}>
      <PrimitiveNumberField.Group render={<InputGroup className={cn(className)} />}>
        {showSteppers && (
          <InputGroupAddon>
            <PrimitiveNumberField.Decrement render={<InputGroupButton size="icon-xs" />}>
              <MinusIcon />
            </PrimitiveNumberField.Decrement>
          </InputGroupAddon>
        )}
        <PrimitiveNumberField.Input render={<InputGroupInput />} />
        {showSteppers && (
          <InputGroupAddon align="inline-end">
            <PrimitiveNumberField.Increment render={<InputGroupButton size="icon-xs" />}>
              <PlusIcon />
            </PrimitiveNumberField.Increment>
          </InputGroupAddon>
        )}
      </PrimitiveNumberField.Group>
    </PrimitiveNumberField.Root>
  )
}

export { NumberField }
