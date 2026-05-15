"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

type DemoProps = {
  className?: string;
  children?: React.ReactNode;
};

export const Component = ({ className, children }: DemoProps): React.JSX.Element => {
  const [count] = useState(0);

  return (
    <div className={cn("min-h-screen w-full bg-white relative overflow-hidden", className)} data-count={count}>
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at center, #6366f1, transparent)",
        }}
      />
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.92)), url('https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1600&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.2,
        }}
      />
      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
};

export default Component;
