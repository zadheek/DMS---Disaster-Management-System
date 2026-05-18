"use client";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import DonationCard from "@/components/public/DonationCard";
import DonateModal from "@/components/public/DonateModal";

export default function DonationsPage() {
  const [drives, setDrives] = useState([]);
  const [selected, setSelected] = useState(null);

  const fetchDrives = useCallback(async () => {
    const { data } = await axios.get("/api/donations");
    if (data.success) setDrives(data.data.items || data.data);
  }, []);

  useEffect(() => {
    fetchDrives().catch(() => toast.error("Failed to load donation drives"));
  }, [fetchDrives]);

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title="Donation Drives" />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {drives.map((drive, index) => (
              <DonationCard key={drive.id} donation={drive} index={index} onDonate={setSelected} />
            ))}
          </div>
        </main>
      </div>
      <DonateModal donation={selected} open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}
