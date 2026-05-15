"use client";
import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "@/lib/time";
import { toast } from "sonner";
import axios from "axios";
import { CheckCircle, Trash2, Search, User, Edit2 } from "lucide-react";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import DataTable from "@/components/admin/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const TABS = ["MISSING", "FOUND", "FLAGGED"];

const dedupeById = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

// Module-scope component — avoids remount/closure churn on every render
const PhotoCell = ({ url, name }) => {
  const [imgError, setImgError] = useState(false);
  if (!url || imgError) {
    return (
      <div className="w-10 h-10 rounded-md bg-[var(--bg-elevated)] flex items-center justify-center">
        <User className="w-5 h-5 text-[var(--text-muted)]" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-md overflow-hidden bg-[var(--bg-elevated)]">
      <img
        src={url}
        alt={`Photo of ${name}`}
        className="w-full h-full object-cover"
        onError={() => setImgError(true)}
      />
    </div>
  );
};

const ActionsCell = ({ row, onMarkFound, onDelete, onEdit, actionLoading }) => (
  <div className="flex items-center gap-1.5">
    {row.status === "MISSING" && (
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs text-[var(--safe)] hover:text-[var(--safe)] hover:bg-[var(--safe)]/10"
        disabled={actionLoading === row.id}
        onClick={() => onMarkFound(row)}
      >
        <CheckCircle className="w-3 h-3 mr-1" />
        Found
      </Button>
    )}
    <Button
      size="sm"
      variant="ghost"
      className="h-7 px-2 text-xs text-[var(--info)] hover:text-[var(--info)] hover:bg-[var(--info)]/10"
      disabled={actionLoading === row.id}
      onClick={() => onEdit(row)}
    >
      <Edit2 className="w-3 h-3" />
    </Button>
    <Button
      size="sm"
      variant="ghost"
      className="h-7 px-2 text-xs text-[var(--critical)] hover:text-[var(--critical)] hover:bg-[var(--critical)]/10"
      disabled={actionLoading === row.id}
      onClick={() => onDelete(row)}
    >
      <Trash2 className="w-3 h-3" />
    </Button>
  </div>
);

export default function AdminMissingPage() {
  const [activeTab, setActiveTab] = useState("MISSING");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({});

  const fetchMissing = useCallback(
    async (tab = activeTab, p = page) => {
      setLoading(true);
      try {
        let url;
        if (tab === "FLAGGED") {
          url = `/api/missing?flagged=true&page=${p}&limit=20`;
        } else {
          url = `/api/missing?status=${tab}&page=${p}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ""}`;
        }
        const { data } = await axios.get(url);
        if (data.success) {
          setItems(dedupeById(data.data.items));
          setTotalPages(data.data.totalPages);
        }
      } catch {
        toast.error("Failed to load missing persons");
      } finally {
        setLoading(false);
      }
    },
    [activeTab, page, search]
  );

  useEffect(() => {
    fetchMissing(activeTab, page);
  }, [activeTab, page, search]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(1);
    setSearch("");
  };

  const handleEdit = (row) => {
    setEditTarget(row);
    setEditForm({
      name: row.name,
      age: row.age,
      idNumber: row.idNumber || "",
      lastSeenLocation: row.lastSeenLocation,
      status: row.status,
    });
  };

  const handleEditSave = async () => {
    try {
      await axios.put(`/api/missing/${editTarget.id}`, {
        ...editForm,
        age: parseInt(editForm.age, 10),
      });
      toast.success("Missing person updated");
      setEditTarget(null);
      fetchMissing();
    } catch {
      toast.error("Failed to update missing person");
    }
  };

  const handleMarkFound = (row) => {
    setConfirm({
      title: "Mark as Found",
      description: `Mark "${row.name}" as found?`,
      confirmLabel: "Mark Found",
      onConfirm: async () => {
        setActionLoading(row.id);
        try {
          await axios.put(`/api/missing/${row.id}`, { status: "FOUND" });
          toast.success("Marked as found");
          setItems((prev) => prev.filter((i) => i.id !== row.id));
        } catch {
          toast.error("Failed to update");
        } finally {
          setActionLoading(null);
          setConfirm(null);
        }
      },
    });
  };

  const handleDelete = (row) => {
    setConfirm({
      title: "Delete Report",
      description: `Delete report for "${row.name}"? Cannot be undone.`,
      destructive: true,
      onConfirm: async () => {
        setActionLoading(row.id);
        try {
          await axios.delete(`/api/missing/${row.id}`);
          toast.success("Report deleted");
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

  const columns = [
    {
      key: "photoUrl",
      label: "",
      render: (v, row) => <PhotoCell url={v} name={row.name} />,
    },
    {
      key: "name",
      label: "Name",
      render: (v, row) => (
        <div>
          <p className="font-medium text-[var(--text-primary)]">{v}</p>
          <p className="text-xs text-[var(--text-muted)]">Age {row.age}</p>
        </div>
      ),
    },
    {
      key: "idNumber",
      label: "ID",
      render: (v) => (
        <span className="font-mono text-xs text-[var(--text-muted)]">{v || "—"}</span>
      ),
    },
    { key: "lastSeenLocation", label: "Last Seen" },
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
          onMarkFound={handleMarkFound}
          onDelete={handleDelete}
          onEdit={handleEdit}
          actionLoading={actionLoading}
        />
      ),
    },
  ];

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 overflow-hidden">
      <Sidebar adminMode />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Missing Persons Management" />
        <main className="flex-1 overflow-y-auto p-5 space-y-4 motion-fade-up">
          <div className="flex items-center gap-3">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1">
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
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
              <Input
                placeholder="Search by name, location, ID..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 h-9 w-64 bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] text-sm"
              />
            </div>
          </div>

          <DataTable
            columns={columns}
            data={items}
            loading={loading}
            page={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
            emptyMessage={`No ${activeTab.toLowerCase()} persons.`}
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
          <DialogContent className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Missing Person</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)] focus:ring-[var(--accent)]"
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Age</Label>
                <Input
                  type="number"
                  className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)] focus:ring-[var(--accent)]"
                  value={editForm.age}
                  onChange={(e) => setEditForm(prev => ({ ...prev, age: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>ID Number</Label>
                <Input
                  className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)] focus:ring-[var(--accent)]"
                  value={editForm.idNumber}
                  onChange={(e) => setEditForm(prev => ({ ...prev, idNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Seen Location</Label>
                <Input
                  className="bg-[var(--bg-elevated)] text-[var(--text-primary)] border-[var(--border)] focus:ring-[var(--accent)]"
                  value={editForm.lastSeenLocation}
                  onChange={(e) => setEditForm(prev => ({ ...prev, lastSeenLocation: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="flex h-10 w-full rounded-md border bg-[var(--bg-elevated)] px-3 py-2 text-sm border-[var(--border)] focus:ring-[var(--accent)]"
                  value={editForm.status}
                  onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="MISSING">MISSING</option>
                  <option value="FOUND">FOUND</option>
                </select>
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

