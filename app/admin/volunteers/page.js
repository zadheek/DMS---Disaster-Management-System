"use client";
import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "@/lib/time";
import { toast } from "sonner";
import axios from "axios";
import dynamic from "next/dynamic";
import { Download, Table2, Map, UserCheck, UserX, Trash2 } from "lucide-react";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import DataTable from "@/components/admin/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false });

const SKILL_OPTIONS = [
  { value: "ALL", label: "All Skills" },
  { value: "MEDICAL", label: "Medical" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "RESCUE", label: "Rescue" },
  { value: "FOOD", label: "Food" },
  { value: "COMMUNICATION", label: "Communication" },
];

const STATUS_TABS = ["ALL", "AVAILABLE", "DEPLOYED"];

// Module-scope components — avoids remount on every render
const SkillBadges = ({ skills }) => (
  <div className="flex flex-wrap gap-1">
    {(skills || []).map((s) => (
      <span
        key={s}
        className="text-xs px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20"
      >
        {s}
      </span>
    ))}
  </div>
);

const ActionsCell = ({ row, setDeployTarget, setDeleteTarget, actionLoading }) => (
  <div className="flex items-center gap-1">
    <Button
      size="sm"
      variant="ghost"
      className={`h-7 px-2 text-xs ${
        row.status === "AVAILABLE"
          ? "text-[var(--info)] hover:text-[var(--info)] hover:bg-[var(--info)]/10"
          : "text-[var(--safe)] hover:text-[var(--safe)] hover:bg-[var(--safe)]/10"
      }`}
      disabled={actionLoading === row.id}
      onClick={() => setDeployTarget(row)}
    >
      {row.status === "AVAILABLE" ? (
        <>
          <UserCheck className="w-3 h-3 mr-1" />
          Deploy
        </>
      ) : (
        <>
          <UserX className="w-3 h-3 mr-1" />
          Undeploy
        </>
      )}
    </Button>
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-[var(--critical)] hover:text-[var(--critical)]/80"
      onClick={() => setDeleteTarget(row)}
    >
      <Trash2 className="w-3.5 h-3.5" />
    </Button>
  </div>
);

export default function AdminVolunteersPage() {
  const [view, setView] = useState("table");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [skillFilter, setSkillFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState(null);
  const [deployTarget, setDeployTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchVolunteers = useCallback(
    async (p = page) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: p, limit: 20 });
        if (statusFilter !== "ALL") params.set("status", statusFilter);
        if (skillFilter !== "ALL") params.set("skill", skillFilter);
        const { data } = await axios.get(`/api/volunteers?${params}`);
        if (data.success) {
          setItems(data.data.items);
          setTotalPages(data.data.totalPages);
        }
      } catch {
        toast.error("Failed to load volunteers");
      } finally {
        setLoading(false);
      }
    },
    [page, statusFilter, skillFilter]
  );

  useEffect(() => {
    fetchVolunteers(page);
  }, [page, statusFilter, skillFilter]);

  const handleStatusToggle = async (volunteer) => {
    const newStatus = volunteer.status === "AVAILABLE" ? "DEPLOYED" : "AVAILABLE";
    setActionLoading(volunteer.id);
    try {
      await axios.put(`/api/volunteers/${volunteer.id}`, { status: newStatus });
      toast.success(`Volunteer marked as ${newStatus.toLowerCase()}`);
      setItems((prev) =>
        prev.map((v) => (v.id === volunteer.id ? { ...v, status: newStatus } : v))
      );
    } catch {
      toast.error("Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/api/volunteers/${id}`);
      if (res.data.success) {
        setItems((prev) => prev.filter((v) => v.id !== id));
        toast.success("Volunteer deleted");
      }
    } catch {
      toast.error("Failed to delete volunteer");
    } finally {
      setDeleteTarget(null);
    }
  };

  const exportCSV = async () => {
    try {
      const { data } = await axios.get("/api/volunteers?format=csv", {
        responseType: "blob",
      });
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = "volunteers.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Export failed");
    }
  };

  // SkillBadges and ActionsCell moved to module scope above

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (v) => (
        <p className="font-medium text-[var(--text-primary)]">{v}</p>
      ),
    },
    { key: "phone", label: "Phone" },
    {
      key: "email",
      label: "Email",
      render: (v) => (
        <span className="text-[var(--text-muted)]">{v || "—"}</span>
      ),
    },
    { key: "location", label: "Location" },
    {
      key: "skills",
      label: "Skills",
      render: (v) => <SkillBadges skills={v} />,
    },
    {
      key: "status",
      label: "Status",
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (v) => formatDistanceToNow(new Date(v), { addSuffix: true }),
    },
    {
      key: "actions",
      label: "",
      render: (_, row) => (
        <ActionsCell
          row={row}
          setDeployTarget={setDeployTarget}
          setDeleteTarget={setDeleteTarget}
          actionLoading={actionLoading}
        />
      ),
    },
  ];

  const mapPins = items.map((v) => ({
    id: v.id,
    lat: v.lat,
    lng: v.lng,
    type: "VOLUNTEER",
    title: v.name,
    description: `${v.location} — ${v.status}`,
  }));

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 overflow-hidden">
      <Sidebar adminMode />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Volunteers">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] gap-1.5"
            onClick={exportCSV}
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </Button>
        </TopBar>
        <main className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status tabs */}
            <Tabs
              value={statusFilter}
              onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
            >
              <TabsList className="bg-[var(--bg-surface)] border border-[var(--border)]">
                {STATUS_TABS.map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="data-[state=active]:bg-[var(--bg-elevated)] data-[state=active]:text-[var(--text-primary)] text-[var(--text-muted)] text-xs"
                  >
                    {t}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* Skill filter */}
            <Select
              value={skillFilter}
              onValueChange={(v) => { setSkillFilter(v); setPage(1); }}
            >
              <SelectTrigger className="h-9 w-44 bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-elevated)] border-[var(--border)]">
                {SKILL_OPTIONS.map((o) => (
                  <SelectItem
                    key={o.value}
                    value={o.value}
                    className="text-[var(--text-primary)] focus:bg-[var(--bg-surface)] text-xs"
                  >
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="ml-auto flex items-center gap-1 p-1 bg-[var(--bg-surface)] border border-[var(--border)] rounded-md">
              <Button
                size="sm"
                variant="ghost"
                className={`h-7 px-2 text-xs gap-1 ${view === "table" ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
                onClick={() => setView("table")}
              >
                <Table2 className="w-3.5 h-3.5" />
                Table
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={`h-7 px-2 text-xs gap-1 ${view === "map" ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
                onClick={() => setView("map")}
              >
                <Map className="w-3.5 h-3.5" />
                Map
              </Button>
            </div>
          </div>

          {view === "table" ? (
            <DataTable
              columns={columns}
              data={items}
              loading={loading}
              page={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
              emptyMessage="No volunteers found."
            />
          ) : (
            <div className="rounded-lg border border-[var(--border)] overflow-hidden" style={{ height: "calc(100vh - 220px)" }}>
              <LeafletMap pins={mapPins} height="100%" />
            </div>
          )}
        </main>
      </div>

      <ConfirmDialog
        open={!!deployTarget}
        onOpenChange={(open) => !open && setDeployTarget(null)}
        title={deployTarget?.status === "AVAILABLE" ? "Deploy Volunteer?" : "Mark Available?"}
        description={
          deployTarget?.status === "AVAILABLE"
            ? "This marks the volunteer as actively deployed in the field."
            : "This marks the volunteer as available for assignments."
        }
        confirmLabel={deployTarget?.status === "AVAILABLE" ? "Deploy" : "Mark Available"}
        onConfirm={async () => {
          await handleStatusToggle(deployTarget);
          setDeployTarget(null);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Volunteer?"
        description={`Remove ${deleteTarget?.name} from the system. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          await handleDelete(deleteTarget.id);
        }}
      />
    </div>
  );
}

