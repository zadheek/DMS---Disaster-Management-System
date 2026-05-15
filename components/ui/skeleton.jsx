"use client";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-[var(--bg-elevated)]",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
