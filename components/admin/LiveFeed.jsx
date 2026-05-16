"use client";
import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useSocket } from "@/hooks/useSocket";
import { formatDistanceToNow } from "@/lib/time";
import { Bell } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const MAX_ITEMS = 50;
const INITIAL_PER_TYPE = 10;

function itemKey(type, data) {
  return `${type}:${data.id}`;
}

function makeItem(type, data) {
  return {
    id: itemKey(type, data),
    type,
    data,
    timestamp: new Date(data.createdAt),
  };
}

const typeLabels = {
  alert: { label: "Alert", color: "text-[var(--critical)]" },
  missingPerson: { label: "Missing Person", color: "text-[var(--purple)]" },
  roadAlert: { label: "Road Alert", color: "text-[var(--warning)]" },
  volunteer: { label: "Volunteer", color: "text-[var(--accent)]" },
};

export default function LiveFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [alertsRes, missingRes, roadsRes, volunteersRes] = await Promise.all([
          axios.get(`/api/alerts?limit=${INITIAL_PER_TYPE}&page=1`),
          axios.get(`/api/missing?status=MISSING&limit=${INITIAL_PER_TYPE}&page=1`),
          axios.get(`/api/roads?limit=${INITIAL_PER_TYPE}&page=1`),
          axios.get(`/api/volunteers?limit=${INITIAL_PER_TYPE}&page=1`),
        ]);

        if (cancelled) return;

        const initial = [
          ...(alertsRes.data?.data?.items || []).map((item) => makeItem("alert", item)),
          ...(missingRes.data?.data?.items || []).map((item) => makeItem("missingPerson", item)),
          ...(roadsRes.data?.data?.items || []).map((item) => makeItem("roadAlert", item)),
          ...(volunteersRes.data?.data?.items || []).map((item) => makeItem("volunteer", item)),
        ]
          .sort((left, right) => right.timestamp - left.timestamp)
          .slice(0, MAX_ITEMS);

        setItems(initial);
      } catch {
        // Feed still works with realtime admin events even if hydration fails.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const addRealtimeItem = useCallback((type, data) => {
    const key = itemKey(type, data);
    setItems((prev) => [
      { id: key, type, data, timestamp: new Date(data.createdAt || Date.now()) },
      ...prev.filter((item) => item.id !== key),
    ].slice(0, MAX_ITEMS));
  }, []);

  const handleAdminSubmission = useCallback((payload) => {
    if (!payload?.type || !payload?.data) {
      return;
    }
    addRealtimeItem(payload.type, payload.data);
  }, [addRealtimeItem]);

  useSocket("admin:newSubmission", handleAdminSubmission);

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl flex flex-col h-80 shadow-sm">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
        <Bell className="w-4 h-4 text-[var(--accent)]" />
        <div>
          <h3 className="text-sm font-semibold text-[var(--title-color)]">Live Feed</h3>
          <p className="text-[11px] text-[var(--subtitle-color)]">Recent public submissions for admin review</p>
        </div>
        <span className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse ml-auto" />
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full bg-[var(--bg-elevated)]" />
          ))
        ) : items.length === 0 ? (
          <p className="text-sm text-[var(--subtitle-color)] text-center py-8">
            No recent submissions
          </p>
        ) : (
          items.map((item) => {
            const config = typeLabels[item.type] || {
              label: item.type,
              color: "text-[var(--text-muted)]",
            };

            return (
              <div
                key={item.id}
                className="bg-[var(--bg-elevated)] rounded-xl px-3 py-2 text-xs border border-[var(--border)]"
              >
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <span className={cn("font-medium", config.color)}>{config.label}</span>
                  <span className="text-[var(--subtitle-color)]">
                    {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                  </span>
                </div>
                <p className="text-[var(--text-primary)] line-clamp-1">
                  {item.data?.title || item.data?.name || item.data?.roadName || "New submission"}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
