"use client";
import { useState } from "react";
import { AlertTriangle, Info, X } from "lucide-react";
import { useBroadcasts } from "@/context/BroadcastContext";
import { cn } from "@/lib/utils";

const severityConfig = {
  INFO: {
    icon: Info,
    className: "bg-[var(--info)]/10 border-[var(--info)]/45 text-[var(--text-primary)]",
    iconClass: "text-[var(--info)]",
  },
  WARNING: {
    icon: AlertTriangle,
    className: "bg-[var(--warning)]/10 border-[var(--warning)]/45 text-[var(--text-primary)]",
    iconClass: "text-[var(--warning)]",
  },
  CRITICAL: {
    icon: AlertTriangle,
    className: "bg-[var(--critical)]/12 border-[var(--critical)]/55 text-[var(--text-primary)]",
    iconClass: "text-[var(--critical)]",
  },
};

export default function BroadcastBanner() {
  const { broadcasts } = useBroadcasts();
  const [dismissed, setDismissed] = useState([]);

  const visible = broadcasts.filter((b) => !dismissed.includes(b.id));
  if (visible.length === 0) return null;

  return (
    <div className="sticky top-0 z-[100] flex flex-col gap-2 p-2 sm:p-3 bg-transparent">
      {visible.map((broadcast) => {
        const config = severityConfig[broadcast.severity] || severityConfig.INFO;
        const Icon = config.icon;
        return (
          <div
            key={broadcast.id}
            className={cn(
              "flex items-start sm:items-center gap-3 rounded-xl border px-3 sm:px-4 py-3 text-sm shadow-[0_8px_20px_rgba(18,58,114,0.12)] backdrop-blur-sm",
              config.className
            )}
          >
            <Icon className={cn("h-4 w-4 mt-0.5 sm:mt-0 shrink-0", config.iconClass)} />
            <p className="flex-1 font-medium leading-relaxed">{broadcast.message}</p>
            <button
              onClick={() => setDismissed((prev) => [...prev, broadcast.id])}
              className="shrink-0 opacity-70 hover:opacity-100 transition-opacity rounded-md p-1 hover:bg-[var(--bg-surface)]/35"
              aria-label="Dismiss broadcast"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
