"use client";
import { AlertTriangle, Droplets, Flame, Building2, AlertCircle, MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "@/lib/time";
import SeverityBadge from "@/components/shared/SeverityBadge";
import StatusBadge from "@/components/shared/StatusBadge";
import FlagButton from "./FlagButton";
import { cn } from "@/lib/utils";

const typeIcons = {
  LANDSLIDE: AlertTriangle,
  FLOOD: Droplets,
  FIRE: Flame,
  BUILDING_COLLAPSE: Building2,
  OTHER: AlertCircle,
};

const severityBorderColors = {
  CRITICAL: "border-l-[var(--critical)]",
  HIGH: "border-l-[var(--orange)]",
  MEDIUM: "border-l-[var(--warning)]",
  LOW: "border-l-[var(--safe)]",
};

const typeColors = {
  LANDSLIDE: "text-[var(--critical)]",
  FLOOD: "text-[var(--info)]",
  FIRE: "text-[var(--orange)]",
  BUILDING_COLLAPSE: "text-[var(--critical)]",
  OTHER: "text-[var(--warning)]",
};

export default function AlertCard({ alert }) {
  const TypeIcon = typeIcons[alert.type] || AlertCircle;
  const borderCol = severityBorderColors[alert.severity] || "border-l-[var(--border)]";

  return (
    <div
      className={cn(
        "bg-[var(--bg-surface)] border-y border-r border-l-4 border-[var(--border)] rounded-xl p-4 flex flex-col gap-3",
        borderCol,
        "opacity-0 animate-[fade-in_0.2s_ease_forwards]",
        "hover:border-y-[var(--border)]/80 hover:border-r-[var(--border)]/80 hover:bg-[var(--bg-elevated)] transition-all duration-200 shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] px-2 py-0.5 rounded-md text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
              <TypeIcon className={cn("w-3 h-3 shrink-0", typeColors[alert.type])} />
              {alert.type.replace("_", " ")}
            </span>
            <SeverityBadge severity={alert.severity} />
          </div>
          <h3 className="font-semibold text-base text-[var(--text-primary)] leading-tight line-clamp-1">
            {alert.title}
          </h3>
        </div>
        <StatusBadge status={alert.status} />
      </div>

      <div className="flex items-start gap-1.5 text-xs text-[var(--text-muted)] leading-relaxed">
        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--text-muted)]/70" />
        <span className="line-clamp-2">{alert.location}</span>
      </div>

      <p className="text-sm text-[var(--text-muted)] leading-relaxed line-clamp-2 mt-1">
        {alert.description}
      </p>

      <div className="flex items-center justify-between pt-3 mt-auto border-t border-[var(--border)]/50">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-muted)]">{alert.reporterName}</span>
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]/70 uppercase tracking-wide">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
          </div>
        </div>
        <FlagButton targetType="ALERT" targetId={alert.id} flagCount={alert.flagCount} />
      </div>
    </div>
  );
}
