import { cn } from "@/lib/utils";

const statusConfig = {
  ACTIVE: { label: "Active", className: "bg-[var(--safe)]/10 text-[var(--safe)] border-[var(--safe)]/20" },
  RESOLVED: { label: "Resolved", className: "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20" },
  REJECTED: { label: "Rejected", className: "bg-[var(--critical)]/10 text-[var(--critical)] border-[var(--critical)]/20" },
  EXPIRED: { label: "Expired", className: "bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/20" },
  MISSING: { label: "Missing", className: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20" },
  FOUND: { label: "Found", className: "bg-[var(--safe)]/10 text-[var(--safe)] border-[var(--safe)]/20" },
  AVAILABLE: { label: "Available", className: "bg-[var(--safe)]/10 text-[var(--safe)] border-[var(--safe)]/20" },
  DEPLOYED: { label: "Deployed", className: "bg-[var(--accent)]/10 text-[var(--accent)] border-[var(--accent)]/20" },
  CLOSED: { label: "Closed", className: "bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/20" },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || {
    label: status,
    className: "bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border)]",
  };
  return (
    <span className={cn("inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border shadow-[0_1px_0_rgba(255,255,255,0.4)]", config.className)}>
      {config.label}
    </span>
  );
}
