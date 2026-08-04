import * as React from "react";
import { cn } from "../../lib/utils";

function Skeleton({ className, style, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-sm bg-stone-200/70 border border-stone-200/40 relative overflow-hidden",
        className
      )}
      style={{
        background:
          "linear-gradient(90deg, var(--color-surface, #f5f5f4) 0%, var(--color-border-subtle, #f0f0f0) 35%, #e8e8e6 50%, var(--color-border-subtle, #f0f0f0) 65%, var(--color-surface, #f5f5f4) 100%)",
        backgroundSize: "400% 100%",
        animation: "skeleton-shimmer 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
