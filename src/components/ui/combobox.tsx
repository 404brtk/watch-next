import { Combobox as ComboboxPrimitive } from '@base-ui/react/combobox'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, ButtonChevron } from '@/components/ui/button'

const Combobox = ComboboxPrimitive.Root
const ComboboxValue = ComboboxPrimitive.Value
const ComboboxFieldLabel = ComboboxPrimitive.Label

function ComboboxTrigger({
  className,
  children,
  ...props
}: ComboboxPrimitive.Trigger.Props) {
  return (
    <ComboboxPrimitive.Trigger
      data-slot="combobox-trigger"
      render={<Button variant="filter" />}
      className={cn('group/dropdown', className)}
      {...props}
    >
      {children}
      <ButtonChevron />
    </ComboboxPrimitive.Trigger>
  )
}

function ComboboxInput({ className, ...props }: ComboboxPrimitive.Input.Props) {
  return (
    <ComboboxPrimitive.Input
      data-slot="combobox-input"
      className={cn(
        'm-2 min-h-11 w-[calc(100%-1rem)] rounded-xl border border-white/10 bg-background/50 px-3 text-base outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:-outline-offset-2 focus-visible:outline-ring',
        className,
      )}
      {...props}
    />
  )
}

function ComboboxContent({
  className,
  align = 'start',
  sideOffset = 8,
  ...props
}: ComboboxPrimitive.Popup.Props &
  Pick<ComboboxPrimitive.Positioner.Props, 'align' | 'sideOffset'>) {
  return (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner
        align={align}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <ComboboxPrimitive.Popup
          data-slot="combobox-content"
          className={cn(
            'group/combobox-content flex max-h-[min(var(--available-height),28rem)] w-72 max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-[18px] border border-white/10 bg-popover text-popover-foreground shadow-(--control-shadow) outline-none forced-colors:border-[ButtonText]',
            className,
          )}
          {...props}
        />
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  )
}

function ComboboxList({ className, ...props }: ComboboxPrimitive.List.Props) {
  return (
    <ComboboxPrimitive.List
      data-slot="combobox-list"
      className={cn(
        'min-h-0 max-h-72 scroll-py-1 overflow-y-auto overscroll-contain p-1 [scrollbar-width:thin]',
        className,
      )}
      {...props}
    />
  )
}

function ComboboxItem({
  className,
  children,
  ...props
}: ComboboxPrimitive.Item.Props) {
  return (
    <ComboboxPrimitive.Item
      data-slot="combobox-item"
      className={cn(
        'relative flex min-h-11 cursor-pointer items-center gap-3 rounded-xl py-2 ps-3 pe-9 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <ComboboxPrimitive.ItemIndicator className="pointer-events-none absolute end-3">
        <Check className="size-4" aria-hidden="true" />
      </ComboboxPrimitive.ItemIndicator>
    </ComboboxPrimitive.Item>
  )
}

function ComboboxEmpty({ className, ...props }: ComboboxPrimitive.Empty.Props) {
  return (
    <ComboboxPrimitive.Empty
      className={cn(
        'hidden p-4 text-center text-sm text-muted-foreground group-data-empty/combobox-content:block',
        className,
      )}
      {...props}
    />
  )
}

export {
  Combobox,
  ComboboxTrigger,
  ComboboxValue,
  ComboboxFieldLabel,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
}
