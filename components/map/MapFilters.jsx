"use client";
import { cn } from "@/lib/utils";
import { AlertTriangle, Users, Route, Tent, Heart } from "lucide-react";

const filterConfig = [
  { key: "alerts", label: "Alerts", icon: AlertTriangle, color: "#2563eb" },
  { key: "roadAlerts", label: "Roads", icon: Route, color: "#2563eb" },
  { key: "missingPersons", label: "Missing", icon: Users, color: "#2563eb" },
  { key: "reliefCamps", label: "Camps", icon: Tent, color: "#cbd5e1" },
  { key: "donations", label: "Donations", icon: Heart, color: "#cbd5e1" },
];

export default function MapFilters({ filters, counts = {}, onToggle, onSetAll }) {
  const activeLayerCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-extrabold text-slate-500 uppercase tracking-[0.18em]">Map layers</p>
        <p className="mt-2 text-sm font-semibold text-slate-600">{activeLayerCount} of {filterConfig.length} layers visible</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onSetAll?.(true)}
          className={cn(
            "rounded-lg border px-3 py-2.5 text-xs font-bold transition-colors",
            "border-blue-600 bg-blue-600 text-white hover:bg-blue-700"
          )}
        >
          Show all
        </button>
        <button
          type="button"
          onClick={() => onSetAll?.(false)}
          className={cn(
            "rounded-lg border px-3 py-2.5 text-xs font-bold transition-colors",
            "border-blue-200 bg-white text-blue-700 hover:bg-blue-50"
          )}
        >
          Hide all
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {filterConfig.map(({ key, label, icon: Icon, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => onToggle(key)}
            className={cn(
              "flex items-center justify-between gap-3 px-3 py-3 rounded-xl text-sm transition-colors text-left border",
              filters[key]
                ? "border-transparent bg-blue-50 text-slate-900"
                : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50"
            )}
          >
            <span className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: filters[key] ? color : "#d6e2f2" }}
              />
              <Icon className={cn("w-4 h-4 shrink-0", filters[key] ? "text-blue-600" : "text-slate-400")} />
              <span className="truncate font-semibold">{label}</span>
            </span>
            <span className="min-w-6 rounded-full bg-white px-2 py-0.5 text-center text-xs font-semibold text-slate-500 tabular-nums">
              {counts[key] ?? 0}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
