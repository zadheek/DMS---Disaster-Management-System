"use client";
import Link from "next/link";
import { Construction, ArrowRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "@/lib/time";
import StatusBadge from "@/components/shared/StatusBadge";
import FlagButton from "./FlagButton";
import { cn } from "@/lib/utils";

const mapHrefForRoad = (road) => {
  const params = new URLSearchParams({ pinType: "roadAlert", id: String(road.id), zoom: "14" });
  if (Number.isFinite(Number(road.lat)) && Number.isFinite(Number(road.lng))) {
    params.set("lat", String(road.lat));
    params.set("lng", String(road.lng));
  }
  return `/map?${params.toString()}`;
};

export default function RoadCard({ road }) {
  return (
    <div
      className={cn(
        "bg-[var(--bg-surface)] border border-y border-r border-l-4 border-l-[var(--warning)] border-[var(--border)] rounded-xl p-4 flex flex-col gap-3",
        "opacity-0 animate-[fade-in_0.2s_ease_forwards]",
        "hover:border-y-[var(--border)]/80 hover:border-r-[var(--border)]/80 hover:bg-[var(--bg-elevated)] transition-all duration-200 shadow-sm"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-[var(--text-muted)] w-full">
            <span className="truncate max-w-[120px] uppercase text-[10px]">{road.fromLocation}</span>
            <ArrowRight className="w-3.5 h-3.5 text-[var(--warning)] shrink-0" />
            <span className="truncate max-w-[120px] uppercase text-[10px]">{road.toLocation}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Construction className="w-4 h-4 text-[var(--warning)] shrink-0 mt-0.5" />
            <h3 className="font-bold text-[var(--text-primary)] text-base leading-tight line-clamp-2">
              {road.roadName}
            </h3>
          </div>
        </div>
        <StatusBadge status={road.status} />
      </div>

      <p className="text-sm text-[var(--text-muted)] leading-relaxed line-clamp-2 mt-1 flex-grow">
        {road.description}
      </p>

      {road.photoUrl && (
        <img src={road.photoUrl} alt="Road damage" className="w-full h-32 object-cover rounded-lg border border-[var(--border)]/50 shadow-inner" />
      )}

      <div className="flex items-center justify-between pt-3 mt-auto border-t border-[var(--border)]/50">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-muted)]">{road.reporterName || "Anonymous"}</span>
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]/70 uppercase tracking-wide">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(road.createdAt), { addSuffix: true })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={mapHrefForRoad(road)}
            className="text-xs font-bold text-blue-600 transition hover:text-blue-700"
            aria-label={`Open ${road.roadName} on map`}
          >
            Open exact location on map
          </Link>
          <FlagButton targetType="ROAD_ALERT" targetId={road.id} flagCount={road.flagCount} />
        </div>
      </div>
    </div>
  );
}
