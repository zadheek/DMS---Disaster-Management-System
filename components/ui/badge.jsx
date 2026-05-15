"use client";
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--accent)] text-white",
        secondary:
          "border-transparent bg-[var(--bg-elevated)] text-[var(--text-primary)]",
        destructive:
          "border-transparent bg-[var(--critical)] text-white",
        outline:
          "text-[var(--text-primary)] border-[var(--border)]",
        warning:
          "border-transparent bg-[var(--warning)] text-black",
        safe:
          "border-transparent bg-[var(--safe)] text-black",
        info:
          "border-transparent bg-[var(--info)] text-white",
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
