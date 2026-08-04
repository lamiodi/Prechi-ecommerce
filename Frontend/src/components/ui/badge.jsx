import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-xs border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-display",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-Primarycolor text-Secondarycolor shadow hover:bg-Primarycolor/80",
        secondary:
          "border-transparent bg-surface text-text-primary hover:bg-surface/80",
        destructive:
          "border-transparent bg-red-600 text-white shadow hover:bg-red-600/80",
        outline: "text-text-primary border-border hover:bg-surface",
        accent: "border-transparent bg-Softcolor text-Primarycolor font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
