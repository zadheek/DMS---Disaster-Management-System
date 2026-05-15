"use client";
import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "@/lib/time";
import { toast } from "sonner";
import axios from "axios";
import { Radio, X, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import ConfirmDialog from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useSocket } from "@/hooks/useSocket";

const BroadcastFormSchema = z.object({
  message: z.string().min(1, "Message is required").max(500),
  severity: z.enum(["INFO", "WARNING", "CRITICAL"]),
  expiresAt: z.string().optional(),
});

const severityConfig = {
  INFO: {
    border: "border-[var(--info)]/30",
    bg: "bg-[var(--info)]/5",
    text: "text-[var(--info)]",
    badge: "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20",
  },
  WARNING: {
    border: "border-[var(--warning)]/30",
    bg: "bg-[var(--warning)]/5",
    text: "text-[var(--warning)]",
    badge: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20",
  },
  CRITICAL: {
    border: "border-[var(--critical)]/30",
    bg: "bg-[var(--critical)]/5",
    text: "text-[var(--critical)]",
    badge: "bg-[var(--critical)]/10 text-[var(--critical)] border-[var(--critical)]/20",
  },
};

export default function AdminBroadcastPage() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(BroadcastFormSchema),
    defaultValues: { severity: "INFO", message: "", expiresAt: "" },
  });

  const watchMessage = watch("message");
  const watchSeverity = watch("severity");

  const fetchBroadcasts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/broadcast?all=true");
      if (data.success) setBroadcasts(data.data);
    } catch (err) {
      if (err?.response?.status === 401) {
        toast.error("Session expired. Please sign in again.");
        return;
      }
      toast.error("Failed to load broadcasts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBroadcasts();
  }, [fetchBroadcasts]);

  // Socket: new broadcast published — deduplicate by ID, let socket be single source of truth
  useSocket(
    "broadcast:message",
    useCallback(
      (b) => {
        setBroadcasts((prev) => [b, ...prev.filter((x) => x.id !== b.id)]);
      },
      []
    )
  );

  // Socket: any broadcast updated or deleted — refetch to stay in sync
  useSocket(
    "broadcasts:updated",
    useCallback(() => {
      fetchBroadcasts();
    }, [fetchBroadcasts])
  );

  const handlePublish = async (values) => {
    setSubmitting(true);
    try {
      const payload = {
        message: values.message,
        severity: values.severity,
      };
      if (values.expiresAt) {
        payload.expiresAt = new Date(values.expiresAt).toISOString();
      }
      const { data } = await axios.post("/api/broadcast", payload);
      if (data.success) {
        toast.success("Broadcast published");
        // Do NOT optimistically prepend here — socket emits broadcast:message and
        // the handler above is the single source of truth, preventing duplicates.
        reset({ severity: "INFO", message: "", expiresAt: "" });
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to publish");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = (broadcast) => {
    setConfirm({
      title: "Deactivate Broadcast",
      description: "Remove this broadcast from public view?",
      confirmLabel: "Deactivate",
      onConfirm: async () => {
        try {
          await axios.put(`/api/broadcast/${broadcast.id}`, { isActive: false });
          toast.success("Broadcast deactivated");
        } catch {
          toast.error("Failed to deactivate");
        } finally {
          setConfirm(null);
        }
      },
    });
  };

  const handleDelete = (broadcast) => {
    setConfirm({
      title: "Delete Broadcast",
      description: "Permanently delete this broadcast?",
      destructive: true,
      onConfirm: async () => {
        try {
          await axios.delete(`/api/broadcast/${broadcast.id}`);
          toast.success("Broadcast deleted");
          setBroadcasts((prev) => prev.filter((b) => b.id !== broadcast.id));
        } catch {
          toast.error("Delete failed");
        } finally {
          setConfirm(null);
        }
      },
    });
  };

  return (
    <div className="flex min-h-[100dvh] bg-slate-50 overflow-hidden">
      <Sidebar adminMode />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Emergency Broadcasts" />
        <main className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Compose */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Radio className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Compose Broadcast
              </h2>
            </div>
            <form onSubmit={handleSubmit(handlePublish)} className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[var(--text-primary)] text-sm">Message</Label>
                  <span
                    className={`text-xs ${(watchMessage || "").length > 480 ? "text-[var(--critical)]" : "text-[var(--text-muted)]"}`}
                  >
                    {(watchMessage || "").length}/500
                  </span>
                </div>
                <Textarea
                  {...register("message")}
                  rows={3}
                  maxLength={500}
                  placeholder="Emergency broadcast message..."
                  className="bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)] resize-none"
                />
                {errors.message && (
                  <p className="text-xs text-[var(--critical)]">{errors.message.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[var(--text-primary)] text-sm">Severity</Label>
                  <Select
                    value={watchSeverity}
                    onValueChange={(v) => setValue("severity", v)}
                  >
                    <SelectTrigger className="bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--bg-elevated)] border-[var(--border)]">
                      {["INFO", "WARNING", "CRITICAL"].map((s) => (
                        <SelectItem
                          key={s}
                          value={s}
                          className="text-[var(--text-primary)] focus:bg-[var(--bg-surface)]"
                        >
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[var(--text-primary)] text-sm">
                    Expires At (optional)
                  </Label>
                  <Input
                    {...register("expiresAt")}
                    type="datetime-local"
                    className="bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]"
                  />
                </div>
              </div>
              <Button
                type="submit"
                className="bg-[var(--critical)] hover:bg-[var(--critical)]/90 text-white gap-2"
                disabled={submitting}
              >
                <Send className="w-4 h-4" />
                {submitting ? "Publishing..." : "Publish Broadcast"}
              </Button>
            </form>
          </div>

          {/* Broadcast List */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">All Broadcasts</h2>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 bg-[var(--bg-surface)]" />
              ))
            ) : broadcasts.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">
                No broadcasts yet.
              </p>
            ) : (
              broadcasts.map((b) => {
                const cfg = severityConfig[b.severity] || severityConfig.INFO;
                return (
                  <div
                    key={b.id}
                    className={`flex items-start gap-3 p-4 rounded-lg border ${cfg.border} ${cfg.bg} ${!b.isActive ? "opacity-50" : ""}`}
                  >
                    <Radio className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.text}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full border ${cfg.badge}`}
                        >
                          {b.severity}
                        </span>
                        {!b.isActive && (
                          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-elevated)] border border-[var(--border)] px-2 py-0.5 rounded-full">
                            Inactive
                          </span>
                        )}
                        <span className="text-xs text-[var(--text-muted)] ml-auto">
                          {formatDistanceToNow(new Date(b.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-primary)]">{b.message}</p>
                      {b.expiresAt && (
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                          Expires: {new Date(b.expiresAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {b.isActive && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs text-[var(--warning)] hover:bg-[var(--warning)]/10"
                          onClick={() => handleDeactivate(b)}
                        >
                          Deactivate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-[var(--critical)] hover:bg-[var(--critical)]/10"
                        onClick={() => handleDelete(b)}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
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
    </div>
  );
}

