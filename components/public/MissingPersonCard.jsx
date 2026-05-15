"use client";
import { User, MapPin, Clock } from "lucide-react";
import { formatDistanceToNow } from "@/lib/time";
import StatusBadge from "@/components/shared/StatusBadge";
import FlagButton from "./FlagButton";
import { cn } from "@/lib/utils";

export default function MissingPersonCard({ person }) {
  return (
    <div
      className={cn(
        "bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-4 flex flex-col gap-4",
        "opacity-0 animate-[fade-in_0.2s_ease_forwards]",
        "hover:border-y-[var(--border)]/80 hover:border-r-[var(--border)]/80 hover:bg-[var(--bg-elevated)] transition-all duration-200 shadow-sm relative overflow-hidden"
      )}
    >
      <div className="absolute top-4 right-4 z-10">
        <StatusBadge status={person.status} />
      </div>

      <div className="w-full h-32 bg-[var(--bg-elevated)] rounded-lg overflow-hidden border border-[var(--border)]/50 shrink-0 shadow-inner">
        {person.photoUrl ? (
          <img src={person.photoUrl} alt={person.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <User className="w-8 h-8 text-[var(--text-muted)]/40" />
            <span className="text-[10px] font-medium text-[var(--text-muted)]/50 uppercase tracking-widest">No Photo</span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 flex-grow">
        <div className="flex items-start justify-between gap-3 pr-16">
          <div className="flex flex-col">
            <h3 className="font-semibold text-lg text-[var(--text-primary)] leading-tight tracking-tight mt-0">
              {person.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-[var(--text-muted)]">Age {person.age}</span>
              {person.idNumber && (
                <>
                  <span className="w-1 h-1 rounded-full bg-[var(--border)]" />
                  <span className="text-[11px] text-[var(--text-muted)]/70 font-mono tracking-wide uppercase">{person.idNumber}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-start gap-1.5 text-sm text-[var(--text-muted)] leading-relaxed mt-1">
          <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[var(--text-muted)]/70" />
          <span className="line-clamp-2">{person.lastSeenLocation}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 mt-auto border-t border-[var(--border)]/50">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--text-muted)]">{person.reporterName}</span>
          <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)]/70 uppercase tracking-wide">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(person.createdAt), { addSuffix: true })}
          </div>
        </div>
        <FlagButton targetType="MISSING_PERSON" targetId={person.id} flagCount={person.flagCount} />
      </div>
    </div>
  );
}
