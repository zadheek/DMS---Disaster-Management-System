"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const FlagSchema = z.object({
  reason: z.string().min(10, "Reason must be at least 10 characters"),
  reporterName: z.string().min(1, "Your name is required"),
  reporterPhone: z.string().min(7, "Valid phone number required"),
});

const targetRouteMap = {
  ALERT: "alerts",
  ROAD_ALERT: "roads",
  MISSING_PERSON: "missing",
};

export default function FlagModal({ open, onClose, onSuccess, targetType, targetId }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(FlagSchema),
  });

  const onSubmit = async (data) => {
    try {
      const route = targetRouteMap[targetType];
      await axios.post(`/api/${route}/${targetId}/flag`, data);
      toast.success("Report submitted. Thank you for helping.");
      reset();
      onSuccess?.();
    } catch {
      toast.error("Failed to submit report. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[var(--bg-elevated)] border-[var(--border)] text-[var(--text-primary)]">
        <DialogHeader>
          <DialogTitle>Report Suspicious Content</DialogTitle>
          <DialogDescription className="text-[var(--text-muted)]">
            Provide a reason for flagging this item. Admin will review your report.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Textarea
              {...register("reason")}
              placeholder="Describe why this content seems suspicious or inaccurate..."
              className="bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none"
              rows={3}
            />
            {errors.reason && (
              <p className="text-xs text-[var(--critical)]">{errors.reason.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Your Name</Label>
              <Input
                {...register("reporterName")}
                placeholder="Full name"
                className="bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
              {errors.reporterName && (
                <p className="text-xs text-[var(--critical)]">{errors.reporterName.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Your Phone</Label>
              <Input
                {...register("reporterPhone")}
                placeholder="+94 77 000 0000"
                className="bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
              {errors.reporterPhone && (
                <p className="text-xs text-[var(--critical)]">{errors.reporterPhone.message}</p>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-transparent border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[var(--warning)] hover:bg-[var(--warning)]/90 text-white"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
