import { cn } from "@/lib/utils";

export default function StatsCard({
  label,
  value,
  icon: Icon,
  color = "text-[var(--accent)]",
  bg = "bg-[var(--accent)]/10",
  trend,
  className,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 animate-pulse">
        <div className="h-3 w-24 bg-[var(--bg-elevated)] rounded mb-4" />
        <div className="h-8 w-20 bg-[var(--bg-elevated)] rounded" />
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-[var(--bg-surface)]",
      "border border-[var(--border)]",
      "rounded-2xl p-4 flex flex-col justify-between gap-3",
      "opacity-0 animate-[fade-in_0.2s_ease_forwards]",
      "hover:border-[var(--accent)]/30 transition-all duration-200 shadow-sm",
      className
    )}>
      <div className="flex items-start justify-between gap-4">
        <p className="text-[11px] font-semibold tracking-wide text-[var(--subtitle-color)] uppercase">{label}</p>
        <div className={cn("p-2 rounded-full border border-[var(--accent)]/20", bg, color?.replace("text-", "text-"))}>
          <Icon className={cn("w-4 h-4", color)} />
        </div>
      </div>
      <div>
        <p className="text-2xl font-semibold text-[var(--title-color)]">{value ?? "—"}</p>
        {trend !== undefined && (
          <p className="text-xs font-medium text-[var(--subtitle-color)] tracking-wide mt-1.5">{trend}</p>
        )}
      </div>
    </div>
  );
}
