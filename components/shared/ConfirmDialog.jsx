"use client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  loading = false,
}) {
  const handleOpenChange = (o) => {
    if (onOpenChange) onOpenChange(o);
    if (!o) onCancel?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="bg-[var(--bg-elevated)] border-[var(--border)]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-[var(--text-primary)]">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-[var(--text-muted)]">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={onCancel}
            className="bg-transparent border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-surface)]"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              destructive
                ? "bg-[var(--critical)] hover:bg-[var(--critical)]/90 text-white"
                : "bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white"
            )}
          >
            {loading ? "Processing..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
