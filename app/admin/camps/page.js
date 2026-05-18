"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import axios from "axios";
import { QrCode, Download, Plus, X, Users, Trash2, Clock, Search, Map } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ReliefCampSchema } from "@/schemas/camp.schema";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import StatusBadge from "@/components/shared/StatusBadge";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useSocket } from "@/hooks/useSocket";

export default function AdminCampsPage() {
  const [camps, setCamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrCamp, setQrCamp] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [membersCamp, setMembersCamp] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [globalCampFilter, setGlobalCampFilter] = useState("");
  const [globalResults, setGlobalResults] = useState(null);
  const [globalSearching, setGlobalSearching] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const qrRef = useRef(null);
  const searchDebounceRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(ReliefCampSchema) });

  const fetchCamps = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/camps");
      if (data.success) setCamps(data.data);
    } catch {
      toast.error("Failed to load camps");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCamps();
  }, [fetchCamps]);

  // Real-time search with debounce
  useEffect(() => {
    // Clear previous timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    // If search is empty, clear results
    if (!memberSearch.trim()) {
      setGlobalResults(null);
      return;
    }

    // Set new debounced search
    setGlobalSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const { data } = await axios.get(
          `/api/admin/camps/checkins?query=${encodeURIComponent(memberSearch)}&campId=${encodeURIComponent(globalCampFilter)}`
        );
        if (data.success) {
          setGlobalResults(data.data.items || []);
        }
      } catch {
        toast.error("Failed to search members");
      } finally {
        setGlobalSearching(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [memberSearch, globalCampFilter]);

  useSocket(
    "update:campOccupancy",
    useCallback(
      (updated) => {
        setCamps((prev) =>
          prev.map((c) => (c.id === updated.id ? { ...c, currentOccupancy: updated.currentOccupancy } : c))
        );
      },
      []
    )
  );

  // Handle camp filter change — trigger new search
  const handleCampFilterChange = (e) => {
    setGlobalCampFilter(e.target.value);
  };

  const handleCreate = async (values) => {
    setCreating(true);
    try {
      const { data } = await axios.post("/api/camps", {
        ...values,
        lat: parseFloat(values.lat),
        lng: parseFloat(values.lng),
        capacity: parseInt(values.capacity),
      });
      if (data.success) {
        toast.success("Camp created");
        setCamps((prev) => [data.data, ...prev]);
        reset();
        setCreateOpen(false);
      }
    } catch {
      toast.error("Failed to create camp");
    } finally {
      setCreating(false);
    }
  };

  const handleMarkClosed = (camp) => {
    setConfirm({
      title: "Close Camp",
      description: `Mark "${camp.name}" as closed?`,
      confirmLabel: "Close Camp",
      destructive: true,
      onConfirm: async () => {
        try {
          await axios.put(`/api/camps/${camp.id}`, { status: "CLOSED" });
          toast.success("Camp closed");
          setCamps((prev) =>
            prev.map((c) => (c.id === camp.id ? { ...c, status: "CLOSED" } : c))
          );
        } catch {
          toast.error("Failed to close camp");
        } finally {
          setConfirm(null);
        }
      },
    });
  };

  const fetchMembers = useCallback(async (camp) => {
    setMembersCamp(camp);
    setMembersOpen(true);
    setMembersLoading(true);
    try {
      const { data } = await axios.get(`/api/camps/${camp.id}/checkin`);
      if (data.success) setMembers(data.data);
    } catch {
      toast.error("Failed to load members");
    } finally {
      setMembersLoading(false);
    }
  }, []);

  const handleRemoveMemberClick = (m) => {
    setConfirm({
      title: "Remove Member",
      description: `Remove ${m.personName} from this camp?`,
      confirmLabel: "Remove",
      destructive: true,
      onConfirm: async () => {
        try {
          await axios.delete(`/api/camps/${membersCamp.id}/checkin/${m.id}`);
          setMembers((prev) => prev.filter((member) => member.id !== m.id));
          setCamps((prev) =>
            prev.map((c) =>
              c.id === membersCamp.id
                ? { ...c, currentOccupancy: Math.max(0, c.currentOccupancy - 1) }
                : c
            )
          );
          toast.success("Member removed");
        } catch {
          toast.error("Failed to remove member");
        } finally {
          setConfirm(null);
        }
      }
    });
  };

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const img = new window.Image();
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 256, 256);
      ctx.drawImage(img, 0, 0);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `camp-${qrCamp?.name || "qr"}.png`;
      a.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const checkinUrl = (camp) =>
    `${typeof window !== "undefined" ? window.location.origin : ""}/checkin?camp=${camp.qrCode}`;

  const occupancyPct = (camp) =>
    camp.capacity > 0 ? Math.min((camp.currentOccupancy / camp.capacity) * 100, 100) : 0;

  const occupancyColor = (pct) => {
    if (pct >= 90) return "bg-[var(--critical)]";
    if (pct >= 70) return "bg-[var(--warning)]";
    return "bg-[var(--safe)]";
  };

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 overflow-hidden">
      <Sidebar adminMode />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Relief Camps">
          <Button
            size="sm"
            className="h-8 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-xs gap-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Camp
          </Button>
        </TopBar>
        <main className="flex-1 overflow-y-auto p-5 space-y-6">
          
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Search className="w-4 h-4 text-[var(--text-muted)]" />
              Find Person in Camps (Real-time Search)
            </h2>
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 w-full space-y-1.5">
                <Label htmlFor="member-search" className="text-xs text-[var(--text-muted)]">Name or ID</Label>
                <Input
                  id="member-search"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Type to search... (auto-updated)"
                  className="bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] h-9"
                />
              </div>
              <div className="w-full sm:w-64 space-y-1.5">
                <Label htmlFor="camp-filter" className="text-xs text-[var(--text-muted)]">Filter by Camp (Optional)</Label>
                <select
                  id="camp-filter"
                  value={globalCampFilter}
                  onChange={handleCampFilterChange}
                  className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] h-9 rounded-md px-3 text-sm focus:ring-1 focus:ring-[var(--accent)] outline-none"
                >
                  <option value="">All Camps</option>
                  {camps.map((c, index) => (
                    <option key={c.id} value={c.id}>
                      Camp {index + 1} - {c.location}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {globalResults !== null && (
              <div className="mt-4 pt-4 border-t border-[var(--border)]">
                {globalSearching ? (
                  <p className="text-sm text-[var(--text-muted)] text-center py-4">Searching...</p>
                ) : globalResults.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] text-center py-4">No matching check-ins found.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {globalResults.map((m) => (
                      <div key={m.id} className="flex flex-col gap-1 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] leading-tight">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm text-[var(--text-primary)]">{m.personName}</span>
                          <span className="text-[10px] bg-[var(--bg-surface)] border border-[var(--border)] px-1.5 py-0.5 rounded text-[var(--text-muted)]">
                            {new Date(m.checkedInAt).toLocaleDateString()} {new Date(m.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] space-y-0.5">
                          {m.personId && <p>ID: {m.personId}</p>}
                          <p className="text-[var(--accent)] flex items-center gap-1 mt-1">
                            <Map className="w-3 h-3" /> {m.camp?.name || "Unknown camp"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full bg-[var(--bg-surface)]" />
              ))}
            </div>
          ) : camps.length === 0 ? (
            <p className="text-center text-[var(--text-muted)] py-16">
              No relief camps created yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {camps.map((camp) => {
                const pct = occupancyPct(camp);
                return (
                  <div
                    key={camp.id}
                    className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--text-primary)] line-clamp-1">
                          {camp.name}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{camp.location}</p>
                      </div>
                      <StatusBadge status={camp.status} />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-[var(--text-muted)]">
                        <span>Occupancy</span>
                        <span className="font-medium text-[var(--text-primary)]">
                          {camp.currentOccupancy} / {camp.capacity}
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${occupancyColor(pct)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                        onClick={() => fetchMembers(camp)}
                      >
                        <Users className="w-3 h-3 mr-1.5" />
                        Members ({camp.currentOccupancy})
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 h-7 text-xs border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
                        onClick={() => setQrCamp(camp)}
                      >
                        <QrCode className="w-3 h-3 mr-1.5" />
                        QR Code
                      </Button>
                      {camp.status === "ACTIVE" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 h-7 text-xs border-[var(--critical)]/30 bg-transparent text-[var(--critical)] hover:bg-[var(--critical)]/10"
                          onClick={() => handleMarkClosed(camp)}
                        >
                          Close
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* QR Dialog */}
      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm?.title}
        description={confirm?.description}
        onConfirm={confirm?.onConfirm}
        confirmLabel={confirm?.confirmLabel}
        destructive={confirm?.destructive}
      />
      <Dialog open={!!qrCamp} onOpenChange={(o) => !o && setQrCamp(null)}>
        <DialogContent className="bg-[var(--bg-elevated)] border-[var(--border)] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">
              {qrCamp?.name} — QR Code
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div
              ref={qrRef}
              className="bg-white p-3 rounded-lg"
            >
              {qrCamp && (
                <QRCodeSVG
                  value={checkinUrl(qrCamp)}
                  size={200}
                  level="M"
                  includeMargin={false}
                />
              )}
            </div>
            <p className="text-xs text-[var(--text-muted)] text-center break-all px-2">
              {qrCamp && checkinUrl(qrCamp)}
            </p>
            <Button
              className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-sm"
              onClick={downloadQR}
            >
              <Download className="w-4 h-4 mr-2" />
              Download QR
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Members Dialog */}
      <Dialog open={membersOpen} onOpenChange={(o) => { if (!o) { setMembersOpen(false); setMembersCamp(null); setMembers([]); setMemberSearch(""); } }}>
        <DialogContent className="bg-[var(--bg-elevated)] border-[var(--border)] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">
              {membersCamp?.name} — Members ({members.length})
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-1 mt-2">
            {membersLoading ? (
              <div className="space-y-2 py-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 rounded-md bg-[var(--bg-surface)] animate-pulse" />
                ))}
              </div>
            ) : members.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <Users className="w-8 h-8 text-[var(--text-muted)]/30" />
                <p className="text-sm text-[var(--text-muted)]">No check-ins recorded yet.</p>
              </div>
            ) : (
              members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-md hover:bg-[var(--bg-surface)] group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] leading-none">{m.personName}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      {m.personId && (
                        <span className="text-[11px] text-[var(--text-muted)] font-mono">{m.personId}</span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                        <Clock className="w-3 h-3" />
                        {new Date(m.checkedInAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${m.personName}`}
                    className="h-7 w-7 text-[var(--text-muted)] hover:text-[var(--critical)] hover:bg-[var(--critical)]/10 opacity-100 md:opacity-0 focus-visible:opacity-100 group-hover:opacity-100 transition-all shrink-0"
                    onClick={() => handleRemoveMemberClick(m)}
                    title="Remove member"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Camp Dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) { reset(); setCreateOpen(false); } }}>
        <DialogContent className="bg-[var(--bg-elevated)] border-[var(--border)]">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">Create Relief Camp</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleCreate)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[var(--text-primary)] text-sm">Camp Name</Label>
              <Input
                {...register("name")}
                className="bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
                placeholder="Colombo North Relief Camp"
              />
              {errors.name && (
                <p className="text-xs text-[var(--critical)]">{errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[var(--text-primary)] text-sm">Location</Label>
              <Input
                {...register("location")}
                className="bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
                placeholder="Colombo, Western Province"
              />
              {errors.location && (
                <p className="text-xs text-[var(--critical)]">{errors.location.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[var(--text-primary)] text-sm">Latitude</Label>
                <Input
                  {...register("lat", { valueAsNumber: true })}
                  type="number"
                  step="any"
                  className="bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
                  placeholder="6.9271"
                />
                {errors.lat && (
                  <p className="text-xs text-[var(--critical)]">{errors.lat.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[var(--text-primary)] text-sm">Longitude</Label>
                <Input
                  {...register("lng", { valueAsNumber: true })}
                  type="number"
                  step="any"
                  className="bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
                  placeholder="79.8612"
                />
                {errors.lng && (
                  <p className="text-xs text-[var(--critical)]">{errors.lng.message}</p>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[var(--text-primary)] text-sm">Capacity</Label>
              <Input
                {...register("capacity", { valueAsNumber: true })}
                type="number"
                min="1"
                className="bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
                placeholder="500"
              />
              {errors.capacity && (
                <p className="text-xs text-[var(--critical)]">{errors.capacity.message}</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                onClick={() => { reset(); setCreateOpen(false); }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white"
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Camp"}
              </Button>
            </div>
          </form>
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
