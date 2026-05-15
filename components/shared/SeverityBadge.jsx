import { cn } from "@/lib/utils";

const severityConfig = {
  CRITICAL: {
    label: "Critical",
    className: "bg-[var(--critical)]/10 text-[var(--critical)] border-[var(--critical)]/20",
    dotClass: "bg-[var(--critical)] animate-pulse",
  },
  HIGH: {
    label: "High",
    className: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20",
    dotClass: "bg-[var(--warning)]",
  },
  MEDIUM: {
    label: "Medium",
    className: "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20",
    dotClass: "bg-[var(--info)]",
  },
  LOW: {
    label: "Low",
    className: "bg-[var(--safe)]/10 text-[var(--safe)] border-[var(--safe)]/20",
    dotClass: "bg-[var(--safe)]",
  },
};

export default function SeverityBadge({ severity }) {
  const config = severityConfig[severity] || severityConfig.MEDIUM;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border shadow-[0_1px_0_rgba(255,255,255,0.35)]", config.className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dotClass)} />
      {config.label}
    </span>
  );
}
