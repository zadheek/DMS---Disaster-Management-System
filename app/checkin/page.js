"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Camera, Keyboard, QrCode, Square, UserCheck } from "lucide-react";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const QR_REGION_ID = "camp-checkin-qr-reader";

function extractCampCode(value = "") {
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    return url.searchParams.get("camp") || trimmed;
  } catch {
    return trimmed;
  }
}

export default function CheckInPage() {
  const [tab, setTab] = useState("scan");
  const [camps, setCamps] = useState([]);
  const [selectedCampId, setSelectedCampId] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [personName, setPersonName] = useState("");
  const [personId, setPersonId] = useState("");
  const scannerRef = useRef(null);
  const scannedRef = useRef(false);

  const selectedCamp = camps.find((camp) => camp.id === selectedCampId);

  useEffect(() => {
    axios
      .get("/api/camps?status=ACTIVE")
      .then(({ data }) => setCamps(data.data ?? []))
      .catch(() => toast.error("Failed to load relief camps"));
  }, []);

  const resolveCampCode = useCallback(
    async (rawCode, { silent = false } = {}) => {
      const code = extractCampCode(rawCode);
      if (!code) {
        if (!silent) toast.error("QR code is required");
        return null;
      }
      try {
        const { data } = await axios.get(`/api/camps?qrCode=${encodeURIComponent(code)}`);
        const camp = data.data?.[0];
        if (!camp) {
          if (!silent) toast.error("Camp not found");
          return null;
        }
        setSelectedCampId(camp.id);
        setQrValue(code);
        setCamps((prev) => (prev.some((item) => item.id === camp.id) ? prev : [camp, ...prev]));
        return camp;
      } catch {
        if (!silent) toast.error("Camp not found");
        return null;
      }
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const camp = params.get("camp");
    if (camp) {
      setTab("scan");
      setQrValue(camp);
      resolveCampCode(camp);
    }
  }, [resolveCampCode]);

  useEffect(() => {
    return () => {
      scannerRef.current?.stop?.().catch(() => {});
      scannerRef.current?.clear?.().catch(() => {});
    };
  }, []);

  const startScanner = async () => {
    if (scanning) return;
    scannedRef.current = false;
    setScannerReady(false);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(QR_REGION_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          const camp = await resolveCampCode(decodedText);
          if (camp) {
            toast.success(`QR matched ${camp.name}`);
            await stopScanner();
          } else {
            scannedRef.current = false;
          }
        }
      );
      setScanning(true);
      setScannerReady(true);
    } catch (err) {
      console.error("QR scanner error:", err);
      setScanning(false);
      setScannerReady(false);
      toast.error("Camera QR scanner could not start");
    }
  };

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    setScanning(false);
    setScannerReady(false);
    if (!scanner) return;
    try {
      await scanner.stop();
      await scanner.clear();
    } catch {
      // Scanner may already be stopped by the browser.
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    const trimmedName = personName.trim();
    const trimmedId = personId.trim();
    if (!trimmedName) {
      toast.error("Name is required");
      return;
    }
    try {
      setSubmitting(true);
      let camp = selectedCamp;
      if (tab === "scan" && !camp) {
        camp = await resolveCampCode(qrValue);
      }
      if (!camp) {
        toast.error(tab === "manual" ? "Select a camp location" : "Scan or enter a valid camp QR code");
        return;
      }
      await axios.post(`/api/camps/${camp.id}/checkin`, {
        personName: trimmedName,
        personId: trimmedId || undefined,
      });
      toast.success("Checked in successfully");
      setPersonName("");
      setPersonId("");
    } catch {
      toast.error("Check-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title="Camp Check-In" />
        <main className="flex-1 overflow-y-auto p-6">
          <form onSubmit={submit} className="max-w-xl space-y-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid h-auto w-full grid-cols-2 bg-slate-100">
                <TabsTrigger value="scan" className="gap-2 data-[state=active]:text-blue-700">
                  <QrCode className="h-4 w-4" />
                  QR Reader
                </TabsTrigger>
                <TabsTrigger value="manual" className="gap-2 data-[state=active]:text-blue-700">
                  <Keyboard className="h-4 w-4" />
                  Manual
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {tab === "scan" ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div id={QR_REGION_ID} className="min-h-[260px] overflow-hidden rounded-md bg-white" />
                  {!scannerReady && (
                    <div className="mt-3 flex gap-2">
                      <Button type="button" onClick={startScanner} className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
                        <Camera className="h-4 w-4" />
                        Start Camera
                      </Button>
                    </div>
                  )}
                  {scanning && (
                    <Button type="button" variant="outline" onClick={stopScanner} className="mt-3 w-full">
                      <Square className="h-4 w-4" />
                      Stop Scanner
                    </Button>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="camp-qr">Camp QR Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="camp-qr"
                      value={qrValue}
                      onChange={(event) => setQrValue(event.target.value)}
                      placeholder="Paste QR code or check-in URL"
                    />
                    <Button type="button" variant="outline" onClick={() => resolveCampCode(qrValue)}>
                      Check
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="camp-location">Camp Location</Label>
                <select
                  id="camp-location"
                  aria-label="Camp Location"
                  value={selectedCampId}
                  onChange={(event) => setSelectedCampId(event.target.value)}
                  className="flex h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm outline-none focus:border-[var(--accent)]/40 focus:ring-2 focus:ring-[var(--accent)]/25"
                >
                  <option value="">Select camp location</option>
                  {camps.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.location}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedCamp && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">
                <p className="font-semibold">{selectedCamp.name}</p>
                <p className="mt-1 text-xs text-blue-700">{selectedCamp.location}</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="person-name">Name</Label>
                <Input
                  id="person-name"
                  value={personName}
                  onChange={(event) => setPersonName(event.target.value)}
                  placeholder="Person name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="person-id">ID Number</Label>
                <Input
                  id="person-id"
                  value={personId}
                  onChange={(event) => setPersonId(event.target.value)}
                  placeholder="NIC or ID number"
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white hover:bg-blue-700">
              <UserCheck className="h-4 w-4" />
              {submitting ? "Checking in..." : "Check In"}
            </Button>
          </form>
        </main>
      </div>
    </div>
  );
}
