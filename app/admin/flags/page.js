"use client";
import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "@/lib/time";
import { toast } from "sonner";
import axios from "axios";
import { Eye, Trash2, CheckCheck, Flag } from "lucide-react";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import SeverityBadge from "@/components/shared/SeverityBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";

const TABS = [
  { value: "ALERT", label: "Alerts", targetType: "ALERT" },
  { value: "ROAD_ALERT", label: "Road Alerts", targetType: "ROAD_ALERT" },
  { value: "MISSING_PERSON", label: "Missing Persons", targetType: "MISSING_PERSON" },
];

export default function AdminFlagsPage() {
  const [activeTab, setActiveTab] = useState("ALERT");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [flagDetails, setFlagDetails] = useState([]);
  const [flagDetailsLoading, setFlagDetailsLoading] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchFlaggedItems = useCallback(
    async (tab = activeTab) => {
      setLoading(true);
      try {
        const endpointMap = {
          ALERT: "/api/alerts",
          ROAD_ALERT: "/api/roads",
          MISSING_PERSON: "/api/missing",
        };
        const endpoint = endpointMap[tab];
        const { data } = await axios.get(`${endpoint}?flagged=true&limit=100`);
        const items = data?.data?.items || [];
        setItems(items.sort((a, b) => b.flagCount - a.flagCount));
      } catch {
        toast.error("Failed to load flagged items");
      } finally {
        setLoading(false);
      }
    },
    [activeTab]
  );

  useEffect(() => {
    fetchFlaggedItems(activeTab);
    setSelectedItem(null);
  }, [activeTab]);

  const openFlagDetails = async (item) => {
    setSelectedItem(item);
    setFlagDetailsLoading(true);
    setFlagDetails([]);
    try {
      const tabToType = {
        ALERT: "ALERT",
        ROAD_ALERT: "ROAD_ALERT",
        MISSING_PERSON: "MISSING_PERSON",
      };
      const { data } = await axios.get(
        `/api/flags?targetType=${tabToType[activeTab]}&targetId=${item.id}&limit=50`
      );
      if (data.success) {
        setFlagDetails(data.data.items);
      }
    } catch {
      toast.error("Failed to load flag details");
    } finally {
      setFlagDetailsLoading(false);
    }
  };

  const handleMarkReviewed = async (flagId) => {
    try {
      await axios.put(`/api/flags/${flagId}/review`, { reviewed: true });
      toast.success("Flag marked as reviewed");
      setFlagDetails((prev) => prev.filter((f) => f.id !== flagId));
    } catch {
      toast.error("Failed to mark reviewed");
    }
  };

  const handleClearFlags = (item) => {
    setConfirm({
      title: "Clear Flags",
      description: `Reset flag count for this item to 0?`,
      confirmLabel: "Clear Flags",
      onConfirm: async () => {
        setActionLoading(item.id);
        const endpointMap = {
          ALERT: `/api/alerts/${item.id}`,
          ROAD_ALERT: `/api/roads/${item.id}`,
          MISSING_PERSON: `/api/missing/${item.id}`,
        };
        try {
          await axios.put(endpointMap[activeTab], { flagCount: 0 });
          toast.success("Flags cleared");
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, flagCount: 0 } : i))
          );
          setSelectedItem(null);
        } catch {
          toast.error("Failed to clear flags");
        } finally {
          setActionLoading(null);
          setConfirm(null);
        }
      },
    });
  };

  const handleRemoveContent = (item) => {
    const labelMap = {
      ALERT: item.title,
      ROAD_ALERT: item.roadName,
      MISSING_PERSON: item.name,
    };
    setConfirm({
      title: "Remove Content",
      description: `Permanently delete "${labelMap[activeTab]}"? This cannot be undone.`,
      destructive: true,
      confirmLabel: "Delete",
      onConfirm: async () => {
        setActionLoading(item.id);
        const endpointMap = {
          ALERT: `/api/alerts/${item.id}`,
          ROAD_ALERT: `/api/roads/${item.id}`,
          MISSING_PERSON: `/api/missing/${item.id}`,
        };
        try {
          await axios.delete(endpointMap[activeTab]);
          toast.success("Content removed");
          setItems((prev) => prev.filter((i) => i.id !== item.id));
          setSelectedItem(null);
        } catch {
          toast.error("Delete failed");
        } finally {
          setActionLoading(null);
          setConfirm(null);
        }
      },
    });
  };

  const getItemTitle = (item) => {
    if (activeTab === "ALERT") return item.title;
    if (activeTab === "ROAD_ALERT") return item.roadName;
    return item.name;
  };

  const getItemSub = (item) => {
    if (activeTab === "ALERT") return `${item.type} — ${item.location}`;
    if (activeTab === "ROAD_ALERT") return `${item.fromLocation} → ${item.toLocation}`;
    return `Age ${item.age} — ${item.lastSeenLocation}`;
  };

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 overflow-hidden">
      <Sidebar adminMode />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Flagged Items" />
        <main className="flex-1 overflow-y-auto p-5 space-y-4">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
            <TabsList className="bg-[var(--bg-surface)] border border-[var(--border)]">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="data-[state=active]:bg-[var(--bg-elevated)] data-[state=active]:text-[var(--text-primary)] text-[var(--text-muted)] text-xs"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full bg-[var(--bg-surface)]" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-[var(--text-muted)] py-16">
              <Flag className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p>No flagged items in this category.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-[var(--bg-surface)] border border-[var(--warning)]/30 rounded-lg px-4 py-3 flex items-center gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-primary)] line-clamp-1">
                      {getItemTitle(item)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{getItemSub(item)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-semibold text-[var(--warning)] bg-[var(--warning)]/10 border border-[var(--warning)]/20 px-2 py-0.5 rounded-full">
                      {item.flagCount} flags
                    </span>
                    {activeTab === "ALERT" && item.severity && (
                      <SeverityBadge severity={item.severity} />
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-[var(--info)] hover:text-[var(--info)] hover:bg-[var(--info)]/10"
                      onClick={() => openFlagDetails(item)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-[var(--safe)] hover:text-[var(--safe)] hover:bg-[var(--safe)]/10"
                      disabled={actionLoading === item.id}
                      onClick={() => handleClearFlags(item)}
                    >
                      <CheckCheck className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs text-[var(--critical)] hover:text-[var(--critical)] hover:bg-[var(--critical)]/10"
                      disabled={actionLoading === item.id}
                      onClick={() => handleRemoveContent(item)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Flag Details Modal */}
      <Dialog open={!!selectedItem} onOpenChange={(o) => !o && setSelectedItem(null)}>
        <DialogContent className="bg-[var(--bg-elevated)] border-[var(--border)] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">
              Flag Reports — {selectedItem && getItemTitle(selectedItem)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {flagDetailsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-16 bg-[var(--bg-surface)]" />
              ))
            ) : flagDetails.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-6">
                No unreviewed flag reports found.
              </p>
            ) : (
              flagDetails.map((flag) => (
                <div
                  key={flag.id}
                  className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-primary)]">{flag.reason}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        {flag.reporterName} · {flag.reporterPhone} ·{" "}
                        {formatDistanceToNow(new Date(flag.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-xs text-[var(--safe)] hover:bg-[var(--safe)]/10 shrink-0"
                      onClick={() => handleMarkReviewed(flag.id)}
                    >
                      <CheckCheck className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {confirm && (
        <ConfirmDialog
          open
          title={confirm.title}
          description={confirm.description}
          destructive={confirm.destructive}
          confirmLabel={confirm.confirmLabel}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

