"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type BackgroundComponentsProps = {
  className?: string;
  children?: React.ReactNode;
};

export const Component = ({ className, children }: BackgroundComponentsProps): React.JSX.Element => {
  const [count] = useState(0);

  return (
    <div className={cn("min-h-screen w-full relative bg-white", className)} data-count={count}>
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "radial-gradient(circle at center, #FFF991 0%, transparent 70%)",
          opacity: 0.58,
          mixBlendMode: "multiply",
        }}
      />
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at center, rgba(99, 102, 241, 0.26), transparent 62%)",
        }}
      />
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.88), rgba(255,255,255,0.9)), url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.24,
        }}
      />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
};

export default Component;
