"use client";
import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "@/lib/time";
import { toast } from "sonner";
import axios from "axios";
import { CheckCircle, Trash2, Edit2 } from "lucide-react";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import DataTable from "@/components/admin/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import ImageUpload from "@/components/shared/ImageUpload";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSocket } from "@/hooks/useSocket";

const TABS = ["ACTIVE", "RESOLVED", "FLAGGED"];

const dedupeById = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

// Module-scope — avoids remount on every render
const ActionsCell = ({ row, onResolve, onDelete, onEdit, actionLoading }) => (
  <div className="flex items-center gap-1.5">
    {row.status === "ACTIVE" && (
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
    )}
    <Button
      size="sm"
      variant="ghost"
      aria-label={`Edit ${row.roadName}`}
      className="h-7 px-2 text-xs text-[var(--info)] hover:text-[var(--info)] hover:bg-[var(--info)]/10"
      disabled={actionLoading === row.id}
      onClick={() => onEdit(row)}
    >
      <Edit2 className="w-3 h-3" />
    </Button>
    <Button
      size="sm"
      variant="ghost"
      aria-label={`Delete ${row.roadName}`}
      className="h-7 px-2 text-xs text-[var(--critical)] hover:text-[var(--critical)] hover:bg-[var(--critical)]/10"
      disabled={actionLoading === row.id}
      onClick={() => onDelete(row)}
    >
      <Trash2 className="w-3 h-3" />
    </Button>
  </div>
);

export default function AdminRoadsPage() {
  const [activeTab, setActiveTab] = useState("ACTIVE");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchRoads = useCallback(
    async (tab = activeTab, p = page) => {
      setLoading(true);
      try {
        let url;
        if (tab === "FLAGGED") {
          url = `/api/roads?flagged=true&page=${p}&limit=20`;
        } else {
          url = `/api/roads?status=${tab}&page=${p}&limit=20`;
        }
        const { data } = await axios.get(url);
        if (data.success) {
          setItems(dedupeById(data.data.items));
          setTotalPages(data.data.totalPages);
        }
      } catch {
        toast.error("Failed to load road alerts");
      } finally {
        setLoading(false);
      }
    },
    [activeTab, page]
  );

  useEffect(() => {
    fetchRoads(activeTab, page);
  }, [activeTab, page]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const handleEdit = (row) => {
    setEditTarget(row);
    setEditForm({
      fromLocation: row.fromLocation,
      toLocation: row.toLocation,
      roadName: row.roadName,
      description: row.description,
      status: row.status,
      photoUrl: row.photoUrl || "",
    });
  };

  const handleEditSave = async () => {
    try {
      await axios.put(`/api/roads/${editTarget.id}`, editForm);
      toast.success("Road alert updated");
      setEditTarget(null);
      fetchRoads();
    } catch {
      toast.error("Failed to update road alert");
    }
  };

  const handleResolve = (row) => {
    setConfirm({
      title: "Resolve Road Alert",
      description: `Mark "${row.roadName}" as resolved?`,
      confirmLabel: "Resolve",
      onConfirm: async () => {
        setActionLoading(row.id);
        try {
          await axios.put(`/api/roads/${row.id}`, { status: "RESOLVED" });
          toast.success("Road alert resolved");
          setItems((prev) => prev.filter((i) => i.id !== row.id));
        } catch {
          toast.error("Failed to resolve");
        } finally {
          setActionLoading(null);
          setConfirm(null);
        }
      },
    });
  };

  const handleDelete = (row) => {
    setConfirm({
      title: "Delete Road Alert",
      description: `Delete alert for "${row.roadName}"? Cannot be undone.`,
      destructive: true,
      onConfirm: async () => {
        setActionLoading(row.id);
        try {
          await axios.delete(`/api/roads/${row.id}`);
          toast.success("Road alert deleted");
          setItems((prev) => prev.filter((i) => i.id !== row.id));
        } catch {
          toast.error("Delete failed");
        } finally {
          setActionLoading(null);
          setConfirm(null);
        }
      },
    });
  };

  // ActionsCell moved to module scope above

  const columns = [
    {
      key: "roadName",
      label: "Road",
      render: (v) => (
        <p className="font-medium text-[var(--text-primary)] line-clamp-1">{v}</p>
      ),
    },
    {
      key: "photoUrl",
      label: "Image",
      render: (v, row) => (
        <img
          src={v || "/samples/road-alert.svg"}
          alt={`${row.roadName} road evidence`}
          className="h-10 w-16 rounded-md border border-slate-200 object-cover"
          loading="lazy"
        />
      ),
    },
    { key: "fromLocation", label: "From" },
    { key: "toLocation", label: "To" },
    {
      key: "status",
      label: "Status",
      render: (v) => <StatusBadge status={v} />,
    },
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
          onResolve={handleResolve}
          onDelete={handleDelete}
          onEdit={handleEdit}
          actionLoading={actionLoading}
        />
      ),
    },
  ];

  useSocket(
    "update:roadAlert",
    useCallback(() => {
      fetchRoads(activeTab, page);
    }, [fetchRoads, activeTab, page])
  );

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 overflow-hidden">
      <Sidebar adminMode />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Road Alerts Management" />
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
            emptyMessage={`No ${activeTab.toLowerCase()} road alerts.`}
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
              <DialogTitle>Edit Road Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Road Name</Label>
                <Input
                  className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)] focus:ring-[var(--accent)]"
                  value={editForm.roadName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, roadName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>From Location</Label>
                <Input
                  className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)] focus:ring-[var(--accent)]"
                  value={editForm.fromLocation}
                  onChange={(e) => setEditForm(prev => ({ ...prev, fromLocation: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>To Location</Label>
                <Input
                  className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)] focus:ring-[var(--accent)]"
                  value={editForm.toLocation}
                  onChange={(e) => setEditForm(prev => ({ ...prev, toLocation: e.target.value }))}
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
                <Label>Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border bg-[var(--bg-elevated)] px-3 py-2 text-sm border-[var(--border)] focus:ring-[var(--accent)]"
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Road Image</Label>
                <ImageUpload
                  currentUrl={editForm.photoUrl || null}
                  label="Replace road image"
                  onUpload={(url) => setEditForm((prev) => ({ ...prev, photoUrl: url || "" }))}
                />
                <p className="text-xs text-[var(--text-muted)]">
                  Use this to replace unclear or unrelated road damage photos.
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
