"use client";
import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "@/lib/time";
import { toast } from "sonner";
import axios from "axios";
import { CheckCircle, XCircle, Trash2, RotateCcw, Edit2 } from "lucide-react";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import DataTable from "@/components/admin/DataTable";
import SeverityBadge from "@/components/shared/SeverityBadge";
import StatusBadge from "@/components/shared/StatusBadge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import ImageUpload from "@/components/shared/ImageUpload";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/hooks/useSocket";

const TABS = ["ACTIVE", "RESOLVED", "REJECTED", "EXPIRED", "FLAGGED"];

const dedupeById = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

// Module-scope — avoids remount on every render
const ActionsCell = ({ row, onApprove, onResolve, onReject, onDelete, onEdit, actionLoading }) => (
  <div className="flex items-center gap-1.5">
    {row.status === "REJECTED" && (
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs text-[var(--safe)] hover:text-[var(--safe)] hover:bg-[var(--safe)]/10"
        disabled={actionLoading === row.id}
        onClick={() => onApprove(row)}
      >
        <RotateCcw className="w-3 h-3 mr-1" />
        Approve
      </Button>
    )}
    {row.status === "ACTIVE" && (
      <>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-[var(--safe)] hover:text-[var(--safe)] hover:bg-[var(--safe)]/10"
          disabled={actionLoading === row.id}
          onClick={() => onResolve(row)}
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Resolve
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-[var(--warning)] hover:text-[var(--warning)] hover:bg-[var(--warning)]/10"
          disabled={actionLoading === row.id}
          onClick={() => onReject(row)}
        >
          <XCircle className="w-3 h-3 mr-1" />
          Reject
        </Button>
      </>
    )}
    <Button
      size="sm"
      variant="ghost"
      aria-label={`Edit ${row.title}`}
      className="h-7 px-2 text-xs text-[var(--info)] hover:text-[var(--info)] hover:bg-[var(--info)]/10"
      disabled={actionLoading === row.id}
      onClick={() => onEdit(row)}
    >
      <Edit2 className="w-3 h-3" />
    </Button>
    <Button
      size="sm"
      variant="ghost"
      aria-label={`Delete ${row.title}`}
      className="h-7 px-2 text-xs text-[var(--critical)] hover:text-[var(--critical)] hover:bg-[var(--critical)]/10"
      disabled={actionLoading === row.id}
      onClick={() => onDelete(row)}
    >
      <Trash2 className="w-3 h-3" />
    </Button>
  </div>
);

export default function AdminAlertsPage() {
  const [activeTab, setActiveTab] = useState("ACTIVE");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchAlerts = useCallback(
    async (tab = activeTab, p = page) => {
      setLoading(true);
      try {
        let url;
        if (tab === "FLAGGED") {
          url = `/api/alerts?flagged=true&page=${p}&limit=20`;
        } else {
          url = `/api/alerts?status=${tab}&page=${p}&limit=20`;
        }
        const { data } = await axios.get(url);
        if (data.success) {
          setItems(dedupeById(data.data.items));
          setTotalPages(data.data.totalPages);
        }
      } catch {
        toast.error("Failed to load alerts");
      } finally {
        setLoading(false);
      }
    },
    [activeTab, page]
  );

  useEffect(() => {
    fetchAlerts(activeTab, page);
  }, [activeTab, page]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleEdit = (row) => {
    setEditTarget(row);
    setEditForm({
      title: row.title,
      description: row.description,
      location: row.location,
      severity: row.severity,
      type: row.type,
      status: row.status,
      photoUrl: row.photoUrl || "",
    });
  };

  const handleEditSave = async () => {
    try {
      await axios.put(`/api/alerts/${editTarget.id}`, editForm);
      toast.success("Alert updated");
      setEditTarget(null);
      fetchAlerts();
    } catch {
      toast.error("Failed to update alert");
    }
  };

  const handleAction = async (action, row) => {
    const statusMap = {
      resolve: "RESOLVED",
      reject: "REJECTED",
      approve: "ACTIVE",
    };
    if (action === "delete") {
      setConfirm({
        title: "Delete Alert",
        description: `Delete "${row.title}"? This cannot be undone.`,
        destructive: true,
        onConfirm: async () => {
          setActionLoading(row.id);
          try {
            await axios.delete(`/api/alerts/${row.id}`);
            toast.success("Alert deleted");
            setItems((prev) => prev.filter((i) => i.id !== row.id));
          } catch {
            toast.error("Delete failed");
          } finally {
            setActionLoading(null);
            setConfirm(null);
          }
        },
      });
      return;
    }
    if (action === "resolve" || action === "reject") {
      setConfirm({
        title: action === "resolve" ? "Resolve Alert" : "Reject Alert",
        description: `Mark "${row.title}" as ${action === "resolve" ? "resolved" : "rejected"}?`,
        destructive: action === "reject",
        confirmLabel: action === "resolve" ? "Resolve" : "Reject",
        onConfirm: async () => {
          setActionLoading(row.id);
          try {
            await axios.put(`/api/alerts/${row.id}`, { status: statusMap[action] });
            toast.success(`Alert ${action}d`);
            setItems((prev) => prev.filter((i) => i.id !== row.id));
          } catch {
            toast.error(`Failed to ${action} alert`);
          } finally {
            setActionLoading(null);
            setConfirm(null);
          }
        },
      });
      return;
    }
    // approve
    setActionLoading(row.id);
    try {
      await axios.put(`/api/alerts/${row.id}`, { status: "ACTIVE" });
      toast.success("Alert approved");
      setItems((prev) => prev.filter((i) => i.id !== row.id));
    } catch {
      toast.error("Failed to approve alert");
    } finally {
      setActionLoading(null);
    }
  };

  // ActionsCell moved to module scope above

  const columns = [
    {
      key: "title",
      label: "Title",
      render: (v, row) => (
        <div>
          <p className="font-medium text-[var(--text-primary)] line-clamp-1">{v}</p>
          <p className="text-xs text-[var(--text-muted)]">{row.type}</p>
        </div>
      ),
    },
    {
      key: "photoUrl",
      label: "Image",
      render: (v, row) => {
        const src = v || `/samples/${row.type === "LANDSLIDE" ? "landslide" : row.type === "FLOOD" ? "flood" : row.type === "FIRE" ? "fire" : row.type === "BUILDING_COLLAPSE" ? "collapse" : "wind"}-alert.svg`;
        return (
          <img
            src={src}
            alt={`${row.title} evidence`}
            className="h-10 w-16 rounded-md border border-slate-200 object-cover"
            loading="lazy"
          />
        );
      },
    },
    {
      key: "severity",
      label: "Severity",
      render: (v) => <SeverityBadge severity={v} />,
    },
    {
      key: "status",
      label: "Status",
      render: (v) => <StatusBadge status={v} />,
    },
    { key: "location", label: "Location" },
    { key: "reporterName", label: "Reporter" },
    {
      key: "flagCount",
      label: "Flags",
      render: (v) =>
        v > 0 ? (
          <span className="text-[var(--warning)] font-medium">{v}</span>
        ) : (
          "—"
        ),
    },
    {
      key: "createdAt",
      label: "Reported",
      render: (v) => formatDistanceToNow(new Date(v), { addSuffix: true }),
    },
    {
      key: "actions",
      label: "",
      render: (_, row) => (
        <ActionsCell
          row={row}
          onApprove={(r) => handleAction("approve", r)}
          onResolve={(r) => handleAction("resolve", r)}
          onReject={(r) => handleAction("reject", r)}
          onDelete={(r) => handleAction("delete", r)}
          onEdit={(r) => handleEdit(r)}
          actionLoading={actionLoading}
        />
      ),
    },
  ];

  useSocket(
    "update:alert",
    useCallback(() => {
      fetchAlerts(activeTab, page);
    }, [fetchAlerts, activeTab, page])
  );

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 overflow-hidden">
      <Sidebar adminMode />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Alerts Management" />
        <main className="flex-1 overflow-y-auto p-5 space-y-4 motion-fade-up">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList className="bg-[var(--bg-surface)] border border-[var(--border)]">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab}
                  value={tab}
                  className="data-[state=active]:bg-[var(--bg-elevated)] data-[state=active]:text-[var(--text-primary)] text-[var(--text-muted)] text-xs"
                >
                  {tab === "FLAGGED" ? "⚑ Flagged" : tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <DataTable
            columns={columns}
            data={items}
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
            emptyMessage={`No ${activeTab.toLowerCase()} alerts.`}
          />
        </main>
      </div>

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

      {editTarget && (
        <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
          <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)]">
            <DialogHeader>
              <DialogTitle>Edit Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)] focus:ring-[var(--accent)]"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)] focus:ring-[var(--accent)]"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)] focus:ring-[var(--accent)]"
                  value={editForm.location}
                  onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <select
                  className="flex h-10 w-full rounded-md border bg-[var(--bg-elevated)] px-3 py-2 text-sm border-[var(--border)] focus:ring-[var(--accent)]"
                  value={editForm.severity}
                  onChange={(e) => setEditForm(prev => ({ ...prev, severity: e.target.value }))}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="flex h-10 w-full rounded-md border bg-[var(--bg-elevated)] px-3 py-2 text-sm border-[var(--border)] focus:ring-[var(--accent)]"
                  value={editForm.type}
                  onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="LANDSLIDE">LANDSLIDE</option>
                  <option value="FLOOD">FLOOD</option>
                  <option value="FIRE">FIRE</option>
                  <option value="BUILDING_COLLAPSE">BUILDING_COLLAPSE</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border bg-[var(--bg-elevated)] px-3 py-2 text-sm border-[var(--border)] focus:ring-[var(--accent)]"
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="RESOLVED">RESOLVED</option>
                  <option value="REJECTED">REJECTED</option>
                  <option value="EXPIRED">EXPIRED</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Scene Image</Label>
                <ImageUpload
                  currentUrl={editForm.photoUrl || null}
                  label="Replace alert image"
                  onUpload={(url) => setEditForm((prev) => ({ ...prev, photoUrl: url || "" }))}
                />
                <p className="text-xs text-[var(--text-muted)]">
                  Replace unclear or unrelated reporter images before keeping the alert active.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button className="bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90" onClick={handleEditSave}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
