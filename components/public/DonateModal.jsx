"use client";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { CreditCard, Landmark } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { parseBankDetails } from "@/lib/parseBankDetails";

function parseAmount(value) {
  const num = parseFloat(value);
  return Number.isFinite(num) && num > 0 ? num : null;
}

export default function DonateModal({ open, onOpenChange, donation, onSubmitted }) {
  const [busy, setBusy] = useState(false);

  const [wireName, setWireName] = useState("");
  const [wirePhone, setWirePhone] = useState("");
  const [wireAmount, setWireAmount] = useState("");
  const [wireNote, setWireNote] = useState("");

  const [cardName, setCardName] = useState("");
  const [cardPhone, setCardPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardAmount, setCardAmount] = useState("");
  const [cardNote, setCardNote] = useState("");

  const bank = parseBankDetails(donation?.bankDetails);

  const clearForm = () => {
    setWireName("");
    setWirePhone("");
    setWireAmount("");
    setWireNote("");
    setCardName("");
    setCardPhone("");
    setCardNumber("");
    setCardExpiry("");
    setCardCvv("");
    setCardAmount("");
    setCardNote("");
  };

  const submitWire = async (e) => {
    e.preventDefault();
    if (!donation?.id) return;

    setBusy(true);
    try {
      const payload = {
        donorName: wireName.trim(),
        donorPhone: wirePhone.trim(),
        amount: parseAmount(wireAmount),
        donationType: "CASH",
        message: wireNote
          ? `Wire transfer submitted: ${wireNote.trim()}`
          : "Wire transfer submitted by donor",
      };
      await axios.post(`/api/donations/${donation.id}/pledge`, payload);
      toast.success("Transfer intent submitted. Thank you for donating.");
      clearForm();
      onOpenChange(false);
      onSubmitted?.();
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to submit transfer details";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const submitCard = async (e) => {
    e.preventDefault();
    if (!donation?.id) return;

    const digits = cardNumber.replace(/\s+/g, "");
    if (!/^\d{12,19}$/.test(digits)) {
      toast.error("Enter a valid card number");
      return;
    }
    if (!/^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(cardExpiry)) {
      toast.error("Enter expiry as MM/YY");
      return;
    }
    if (!/^\d{3,4}$/.test(cardCvv)) {
      toast.error("Enter a valid CVV");
      return;
    }

    setBusy(true);
    try {
      const payload = {
        donorName: cardName.trim(),
        donorPhone: cardPhone.trim(),
        amount: parseAmount(cardAmount),
        donationType: "CASH",
        message: cardNote
          ? `Sample card payment success (details not stored): ${cardNote.trim()}`
          : "Sample card payment success (details not stored)",
      };
      await axios.post(`/api/donations/${donation.id}/pledge`, payload);
      toast.success("Sample payment successful. Donation recorded.");
      clearForm();
      onOpenChange(false);
      onSubmitted?.();
    } catch (err) {
      const msg = err?.response?.data?.error || "Payment failed";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[var(--bg-elevated)] border-[var(--border)] max-w-2xl">
        <DialogHeader>
          <DialogTitle>Donate to {donation?.organizationName || "Organization"}</DialogTitle>
          <DialogDescription>
            Choose a transfer method or use the sample payment gateway.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="wire" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="wire" className="gap-1.5"><Landmark className="w-4 h-4" />Bank Transfer</TabsTrigger>
            <TabsTrigger value="card" className="gap-1.5"><CreditCard className="w-4 h-4" />Sample Card Gateway</TabsTrigger>
          </TabsList>

          <TabsContent value="wire" className="space-y-4">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3 space-y-2 motion-fade-up">
              <p className="text-xs text-[var(--text-muted)]">Wire transfer destination</p>
              {donation?.bankDetails ? (
                <ul className="space-y-1 text-sm">
                  {bank.bankName && <li className="text-[var(--text-primary)]"><span className="text-[var(--text-muted)]">Bank Name:</span> {bank.bankName}</li>}
                  {bank.accountName && <li className="text-[var(--text-primary)]"><span className="text-[var(--text-muted)]">Account Name:</span> {bank.accountName}</li>}
                  {bank.accountNumber && <li className="text-[var(--text-primary)]"><span className="text-[var(--text-muted)]">Account Number:</span> {bank.accountNumber}</li>}
                  {bank.branch && <li className="text-[var(--text-primary)]"><span className="text-[var(--text-muted)]">Branch:</span> {bank.branch}</li>}
                  {bank.additional.map((line) => <li key={line} className="text-[var(--text-primary)]">{line}</li>)}
                </ul>
              ) : (
                <p className="text-sm text-[var(--text-primary)]">Bank details unavailable. Please contact the organization.</p>
              )}
            </div>

            <form className="space-y-3 motion-fade-up" onSubmit={submitWire}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Your Name</Label>
                  <Input value={wireName} onChange={(e) => setWireName(e.target.value)} required className="bg-[var(--bg-surface)] border-[var(--border)]" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={wirePhone} onChange={(e) => setWirePhone(e.target.value)} required className="bg-[var(--bg-surface)] border-[var(--border)]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Amount (LKR)</Label>
                <Input type="number" min="1" step="0.01" value={wireAmount} onChange={(e) => setWireAmount(e.target.value)} className="bg-[var(--bg-surface)] border-[var(--border)]" />
              </div>
              <div className="space-y-1.5">
                <Label>Reference / Note</Label>
                <Textarea rows={2} value={wireNote} onChange={(e) => setWireNote(e.target.value)} className="bg-[var(--bg-surface)] border-[var(--border)]" />
              </div>
              <Button type="submit" disabled={busy} className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white transition-transform duration-200 hover:-translate-y-0.5">
                {busy ? "Submitting..." : "I Have Sent a Bank Transfer"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="card" className="space-y-4">
            <div className="rounded-lg border border-[var(--warning)]/30 bg-[var(--warning)]/10 p-3 motion-fade-up">
              <p className="text-xs text-[var(--warning)] font-medium">Sample Gateway</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Demo only. Card details are validated on screen and never stored.
              </p>
            </div>

            <form className="space-y-3 motion-fade-up" onSubmit={submitCard}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Your Name</Label>
                  <Input value={cardName} onChange={(e) => setCardName(e.target.value)} required className="bg-[var(--bg-surface)] border-[var(--border)]" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={cardPhone} onChange={(e) => setCardPhone(e.target.value)} required className="bg-[var(--bg-surface)] border-[var(--border)]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Card Number</Label>
                <Input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4111 1111 1111 1111" required className="bg-[var(--bg-surface)] border-[var(--border)]" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1 space-y-1.5">
                  <Label>Expiry</Label>
                  <Input value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="MM/YY" required className="bg-[var(--bg-surface)] border-[var(--border)]" />
                </div>
                <div className="col-span-1 space-y-1.5">
                  <Label>CVV</Label>
                  <Input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="123" required className="bg-[var(--bg-surface)] border-[var(--border)]" />
                </div>
                <div className="col-span-1 space-y-1.5">
                  <Label>Amount (LKR)</Label>
                  <Input type="number" min="1" step="0.01" value={cardAmount} onChange={(e) => setCardAmount(e.target.value)} required className="bg-[var(--bg-surface)] border-[var(--border)]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Message (optional)</Label>
                <Textarea rows={2} value={cardNote} onChange={(e) => setCardNote(e.target.value)} className="bg-[var(--bg-surface)] border-[var(--border)]" />
              </div>

              <Button type="submit" disabled={busy} className="w-full bg-[var(--safe)] hover:bg-[var(--safe)]/90 text-white transition-transform duration-200 hover:-translate-y-0.5">
                {busy ? "Processing..." : "Donate with Card (Sample)"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}