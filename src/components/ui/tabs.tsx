import { Tabs as TabsPrimitive } from '@base-ui/react/tabs'
import { cn } from '@/lib/utils'

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        'inline-flex w-fit max-w-full flex-wrap items-center gap-1 rounded-[30px] border border-white/8 bg-(--glass-fill) p-1.5 shadow-(--control-shadow) backdrop-blur-xl [@media(prefers-reduced-transparency:reduce)]:bg-card forced-colors:border-[ButtonText]',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        'inline-flex min-h-11 min-w-0 max-w-full flex-[1_1_auto] items-center justify-center gap-2 rounded-full border border-transparent px-3 py-2.5 text-base font-medium whitespace-normal text-muted-foreground outline-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-ring data-active:bg-(--glass-selected-fill) data-active:text-foreground data-active:shadow-(--control-shadow) motion-safe:transition-[background-color,color] motion-safe:duration-150 sm:px-4 forced-colors:data-active:border-[Highlight]',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn('min-w-0 flex-1 rounded-sm text-base', className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
