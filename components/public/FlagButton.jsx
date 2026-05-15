"use client";
import { useState } from "react";
import { Flag } from "lucide-react";
import FlagModal from "./FlagModal";
import { cn } from "@/lib/utils";

export default function FlagButton({ targetType, targetId, flagCount = 0 }) {
  const [open, setOpen] = useState(false);
  const [localCount, setLocalCount] = useState(flagCount);

  const handleSuccess = () => {
    setLocalCount((c) => c + 1);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-colors",
          localCount > 0
            ? "text-[var(--warning)] hover:bg-[var(--warning)]/10"
            : "text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
        )}
        title="Flag as suspicious"
      >
        <Flag className="w-3 h-3" />
        {localCount > 0 && <span>{localCount}</span>}
      </button>
      <FlagModal
        open={open}
        onClose={() => setOpen(false)}
        onSuccess={handleSuccess}
        targetType={targetType}
        targetId={targetId}
      />
    </>
  );
}
