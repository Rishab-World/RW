import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      // Modern, clear toggle styles
      "peer inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      "data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-600 data-[state=unchecked]:bg-slate-400/40 data-[state=unchecked]:border-slate-500 dark:data-[state=checked]:bg-amber-600 dark:data-[state=checked]:border-amber-400 dark:data-[state=unchecked]:bg-slate-700/60 dark:data-[state=unchecked]:border-slate-600",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // Thumb styles
        "pointer-events-none block h-6 w-6 rounded-full shadow-lg ring-0 transition-transform duration-200",
        "bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700",
        "data-[state=checked]:translate-x-7 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
