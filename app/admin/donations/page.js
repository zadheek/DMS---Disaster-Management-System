"use client";
import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "@/lib/time";
import { toast } from "sonner";
import axios from "axios";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, HandHeart } from "lucide-react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DonationDriveSchema } from "@/schemas/donation.schema";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import DataTable from "@/components/admin/DataTable";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const NEED_OPTIONS = ["CASH", "FOOD", "CLOTHES", "MEDICINE", "OTHER"];

const needColor = {
  CASH: "text-[var(--safe)] bg-[var(--safe)]/10 border-[var(--safe)]/20",
  FOOD: "text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/20",
  CLOTHES: "text-[var(--info)] bg-[var(--info)]/10 border-[var(--info)]/20",
  MEDICINE: "text-[var(--critical)] bg-[var(--critical)]/10 border-[var(--critical)]/20",
  OTHER: "text-[var(--text-muted)] bg-[var(--bg-elevated)] border-[var(--border)]",
};

export default function AdminDonationsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [pledgeOpen, setPledgeOpen] = useState(false);
  const [pledgeDrive, setPledgeDrive] = useState(null);
  const [pledges, setPledges] = useState([]);
  const [loadingPledges, setLoadingPledges] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({ resolver: zodResolver(DonationDriveSchema) });

  const fetchDonations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/donations?includeInactive=true");
      if (data.success) {
        const list = Array.isArray(data.data) ? data.data : data.data.items || [];
        setItems(list);
      }
    } catch {
      toast.error("Failed to load donation drives");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [fetchDonations]);

  const openCreate = () => {
    setEditTarget(null);
    reset({ organizationName: "", description: "", needs: [], bankDetails: "", externalLink: "", isActive: true });
    setFormOpen(true);
  };

  const openEdit = (drive) => {
    setEditTarget(drive);
    reset({
      organizationName: drive.organizationName,
      description: drive.description,
      needs: drive.needs,
      bankDetails: drive.bankDetails || "",
      externalLink: drive.externalLink || "",
      isActive: drive.isActive,
    });
    setFormOpen(true);
  };

  const openPledges = async (drive) => {
    setPledgeDrive(drive);
    setPledgeOpen(true);
    setLoadingPledges(true);
    try {
      const { data } = await axios.get(`/api/donations/${drive.id}/pledge?limit=100`);
      if (data.success) {
        setPledges(data.data?.pledges || []);
      }
    } catch {
      toast.error("Failed to load pledges");
      setPledges([]);
    } finally {
      setLoadingPledges(false);
    }
  };

  const handleFormSubmit = async (values) => {
    setSubmitting(true);
    try {
      if (editTarget) {
        const { data } = await axios.put(`/api/donations/${editTarget.id}`, values);
        if (data.success) {
          toast.success("Donation drive updated");
          setItems((prev) => prev.map((d) => (d.id === editTarget.id ? { ...data.data, _count: d._count } : d)));
        }
      } else {
        const { data } = await axios.post("/api/donations", values);
        if (data.success) {
          toast.success("Donation drive created");
          setItems((prev) => [{ ...data.data, _count: { pledges: 0 } }, ...prev]);
        }
      }
      setFormOpen(false);
    } catch {
      toast.error(editTarget ? "Update failed" : "Create failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (drive) => {
    setActionLoading(drive.id);
    try {
      await axios.put(`/api/donations/${drive.id}`, { isActive: !drive.isActive });
      toast.success(drive.isActive ? "Drive deactivated" : "Drive activated");
      setItems((prev) =>
        prev.map((d) => (d.id === drive.id ? { ...d, isActive: !d.isActive } : d))
      );
    } catch {
      toast.error("Update failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = (drive) => {
    setConfirm({
      title: "Deactivate Donation Drive",
      description: "This will deactivate the donation drive and remove it from public view.",
      destructive: true,
      confirmLabel: "Deactivate",
      onConfirm: async () => {
        setActionLoading(drive.id);
        try {
          await axios.delete(`/api/donations/${drive.id}`);
          toast.success("Deleted");
          setItems((prev) => prev.filter((d) => d.id !== drive.id));
        } catch {
          toast.error("Delete failed");
        } finally {
          setActionLoading(null);
          setConfirm(null);
        }
      },
    });
  };

  const NeedBadges = ({ needs }) => (
    <div className="flex flex-wrap gap-1">
      {(needs || []).map((n) => (
        <span
          key={n}
          className={`text-xs px-1.5 py-0.5 rounded border ${needColor[n] || needColor.OTHER}`}
        >
          {n}
        </span>
      ))}
    </div>
  );

  const ActionsCell = ({ row }) => (
    <div className="flex items-center gap-1.5">
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs text-[var(--teal)] hover:text-[var(--teal)] hover:bg-[var(--teal)]/10"
        onClick={() => openPledges(row)}
      >
        <HandHeart className="w-3 h-3 mr-1" />
        Pledges
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs text-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent)]/10"
        disabled={actionLoading === row.id}
        onClick={() => openEdit(row)}
      >
        <Pencil className="w-3 h-3 mr-1" />
        Edit
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className={`h-7 px-2 text-xs ${
          row.isActive
            ? "text-[var(--warning)] hover:bg-[var(--warning)]/10"
            : "text-[var(--safe)] hover:bg-[var(--safe)]/10"
        }`}
        disabled={actionLoading === row.id}
        onClick={() => handleToggleActive(row)}
      >
        {row.isActive ? (
          <><ToggleRight className="w-3 h-3 mr-1" />Deactivate</>
        ) : (
          <><ToggleLeft className="w-3 h-3 mr-1" />Activate</>
        )}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-xs text-[var(--critical)] hover:text-[var(--critical)] hover:bg-[var(--critical)]/10"
        disabled={actionLoading === row.id}
        onClick={() => handleDelete(row)}
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );

  const columns = [
    {
      key: "organizationName",
      label: "Organization",
      render: (v) => (
        <p className="font-medium text-[var(--text-primary)] line-clamp-1">{v}</p>
      ),
    },
    {
      key: "needs",
      label: "Needs",
      render: (v) => <NeedBadges needs={v} />,
    },
    {
      key: "pledges",
      label: "Pledges",
      render: (_, row) => (
        <span className="text-sm text-[var(--text-primary)]">{row._count?.pledges || 0}</span>
      ),
    },
    {
      key: "isActive",
      label: "Status",
      render: (v) => (
        <span
          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
            v
              ? "bg-[var(--safe)]/10 text-[var(--safe)] border-[var(--safe)]/20"
              : "bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border)]"
          }`}
        >
          {v ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (v) => formatDistanceToNow(new Date(v), { addSuffix: true }),
    },
    {
      key: "actions",
      label: "",
      render: (_, row) => <ActionsCell row={row} />,
    },
  ];

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 overflow-hidden">
      <Sidebar adminMode />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Donation Drives">
          <Button
            size="sm"
            className="h-8 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-xs gap-1.5"
            onClick={openCreate}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Drive
          </Button>
        </TopBar>
        <main className="flex-1 overflow-y-auto p-5">
          <DataTable
            columns={columns}
            data={items}
            loading={loading}
            emptyMessage="No donation drives yet."
          />
        </main>
      </div>

      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) setFormOpen(false); }}>
        <DialogContent className="bg-[var(--bg-elevated)] border-[var(--border)] max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">
              {editTarget ? "Edit Donation Drive" : "Create Donation Drive"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[var(--text-primary)] text-sm">Organization Name</Label>
              <Input
                {...register("organizationName")}
                className="bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
              />
              {errors.organizationName && (
                <p className="text-xs text-[var(--critical)]">{errors.organizationName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[var(--text-primary)] text-sm">Description</Label>
              <Textarea
                {...register("description")}
                rows={3}
                className="bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] resize-none"
              />
              {errors.description && (
                <p className="text-xs text-[var(--critical)]">{errors.description.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[var(--text-primary)] text-sm">Needs</Label>
              <Controller
                name="needs"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {NEED_OPTIONS.map((need) => (
                      <label
                        key={need}
                        className="flex items-center gap-1.5 cursor-pointer"
                      >
                        <Checkbox
                          checked={(field.value || []).includes(need)}
                          onCheckedChange={(checked) => {
                            const current = field.value || [];
                            field.onChange(
                              checked
                                ? [...current, need]
                                : current.filter((n) => n !== need)
                            );
                          }}
                          className="border-[var(--border)] data-[state=checked]:bg-[var(--accent)] data-[state=checked]:border-[var(--accent)]"
                        />
                        <span className="text-sm text-[var(--text-primary)]">{need}</span>
                      </label>
                    ))}
                  </div>
                )}
              />
              {errors.needs && (
                <p className="text-xs text-[var(--critical)]">{errors.needs.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[var(--text-primary)] text-sm">Bank Details (optional)</Label>
              <Input
                {...register("bankDetails")}
                className="bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
                placeholder="Account no / Bank name"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[var(--text-primary)] text-sm">External Link (optional)</Label>
              <Input
                {...register("externalLink")}
                type="url"
                className="bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]"
                placeholder="https://..."
              />
              {errors.externalLink && (
                <p className="text-xs text-[var(--critical)]">{errors.externalLink.message}</p>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
                onClick={() => setFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white"
                disabled={submitting}
              >
                {submitting ? "Saving..." : editTarget ? "Save Changes" : "Create Drive"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={pledgeOpen} onOpenChange={setPledgeOpen}>
        <DialogContent className="bg-[var(--bg-elevated)] border-[var(--border)] max-w-3xl">
          <DialogHeader>
            <DialogTitle>Donation Pledges</DialogTitle>
            <DialogDescription>
              {pledgeDrive?.organizationName || "Donation drive"} - submitted donor records
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] overflow-y-auto rounded-md border border-[var(--border)]">
            {loadingPledges ? (
              <div className="p-4 text-sm text-[var(--text-muted)]">Loading pledges...</div>
            ) : pledges.length === 0 ? (
              <div className="p-4 text-sm text-[var(--text-muted)]">No pledges yet.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[var(--bg-surface)]">
                  <tr className="text-left text-[var(--text-muted)]">
                    <th className="p-3">Donor</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Type</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">When</th>
                  </tr>
                </thead>
                <tbody>
                  {pledges.map((p) => (
                    <tr key={p.id} className="border-t border-[var(--border)] text-[var(--text-primary)]">
                      <td className="p-3">{p.donorName}</td>
                      <td className="p-3">{p.donorPhone}</td>
                      <td className="p-3">{p.donationType}</td>
                      <td className="p-3">{p.amount ? `LKR ${Number(p.amount).toLocaleString()}` : "-"}</td>
                      <td className="p-3">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
