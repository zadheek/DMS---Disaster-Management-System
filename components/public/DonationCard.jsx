"use client";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { parseBankDetails } from "@/lib/parseBankDetails";

const needColors = {
  CASH: "bg-[var(--teal)]/10 text-[var(--teal)] border-[var(--teal)]/20",
  FOOD: "bg-[var(--safe)]/10 text-[var(--safe)] border-[var(--safe)]/20",
  CLOTHES: "bg-[var(--info)]/10 text-[var(--info)] border-[var(--info)]/20",
  MEDICINE: "bg-[var(--critical)]/10 text-[var(--critical)] border-[var(--critical)]/20",
  OTHER: "bg-[var(--text-muted)]/10 text-[var(--text-muted)] border-[var(--text-muted)]/20",
};

export default function DonationCard({ donation, onDonate, index = 0 }) {
  const bank = parseBankDetails(donation.bankDetails);

  const copyBankDetails = () => {
    if (!donation.bankDetails) {
      toast.error("Bank details not available");
      return;
    }
    navigator.clipboard.writeText(donation.bankDetails);
    toast.success("Bank details copied");
  };

  return (
    <div
      className={cn(
        "bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-4 sm:p-5 space-y-4 shadow-[0_8px_20px_rgba(20,52,102,0.08)] hover:shadow-[0_12px_24px_rgba(20,52,102,0.12)] hover:-translate-y-1 transition-all duration-200",
        "motion-fade-up"
      )}
      style={{ animationDelay: `${Math.min(index * 60, 300)}ms` }}
    >
      <div>
        <h3 className="font-semibold text-[var(--text-primary)]">{donation.organizationName}</h3>
        <p className="text-sm text-[var(--text-muted)] mt-1 line-clamp-3">{donation.description}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {donation.needs?.map((need) => (
          <span
            key={need}
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full border",
              needColors[need] || needColors.OTHER
            )}
          >
            {need}
          </span>
        ))}
      </div>

      {donation.bankDetails && (
        <div className="bg-[var(--bg-elevated)] rounded-xl p-3 space-y-2 border border-[var(--border)]/70">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-[var(--text-muted)]">Wire transfer destination</p>
            <button
              onClick={copyBankDetails}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
              title="Copy bank details"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1.5 text-xs">
            {bank.bankName && (
              <p className="text-[var(--text-primary)]"><span className="text-[var(--text-muted)]">Bank Name:</span> {bank.bankName}</p>
            )}
            {bank.accountName && (
              <p className="text-[var(--text-primary)]">
                <span className="text-[var(--text-muted)]">Account Name:</span>{" "}
                {bank.accountName === donation.organizationName ? "Listed organization" : bank.accountName}
              </p>
            )}
            {bank.accountNumber && (
              <p className="text-[var(--text-primary)]"><span className="text-[var(--text-muted)]">Account Number:</span> {bank.accountNumber}</p>
            )}
            {bank.branch && (
              <p className="text-[var(--text-primary)]"><span className="text-[var(--text-muted)]">Branch:</span> {bank.branch}</p>
            )}
            {bank.additional.map((line) => (
              <p key={line} className="text-[var(--text-primary)]">{line}</p>
            ))}
          </div>
        </div>
      )}

      {donation.externalLink && (
        <a
          href={donation.externalLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          More information
        </a>
      )}

      <Button
        className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white transition-transform duration-200 hover:-translate-y-0.5"
        onClick={() => onDonate?.(donation)}
      >
        Donate Now
      </Button>
    </div>
  );
}
