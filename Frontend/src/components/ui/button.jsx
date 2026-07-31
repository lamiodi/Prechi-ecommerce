import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 font-display",
  {
    variants: {
      variant: {
        default:
          "bg-Primarycolor text-white uppercase tracking-[0.04em] shadow active:scale-[0.98] transition-all hover:bg-Primarycolor/90 rounded-sm",
        destructive:
          "bg-red-500 text-slate-50 shadow-sm hover:bg-red-500/90 rounded-sm",
        outline:
          "border border-border bg-transparent shadow-sm hover:bg-surface hover:text-text-primary rounded-sm transition-all",
        secondary:
          "bg-surface text-text-primary shadow-sm hover:bg-surface/80 rounded-sm transition-all",
        ghost: "hover:bg-surface hover:text-text-primary rounded-sm transition-all",
        link: "text-Primarycolor underline-offset-4 hover:underline transition-all",
      },
      size: {
        default: "h-12 px-8",
        sm: "h-9 rounded-sm px-4 text-xs",
        lg: "h-14 rounded-sm px-10",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }
