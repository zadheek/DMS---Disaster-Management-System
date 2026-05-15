"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CloudRain, ShieldAlert, Wind, ChevronLeft, ChevronRight } from "lucide-react";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import FlagButton from "@/components/public/FlagButton";
import ImageUpload from "@/components/shared/ImageUpload";
import LocationAssist from "@/components/shared/LocationAssist";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSocket } from "@/hooks/useSocket";
import { AlertSchema } from "@/schemas/alert.schema";

const PAGE_SIZE = 12;
const TYPES = ["ALL", "LANDSLIDE", "FLOOD", "FIRE", "BUILDING_COLLAPSE"];
const SEVERITIES = ["ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"];
const SEVERITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const ALERT_SAMPLE_IMAGES = {
  FLOOD: "/samples/flood-alert.svg",
  LANDSLIDE: "/samples/landslide-alert.svg",
  FIRE: "/samples/fire-alert.svg",
  BUILDING_COLLAPSE: "/samples/collapse-alert.svg",
  OTHER: "/samples/wind-alert.svg",
};

const mapHrefForAlert = (alert) => {
  const params = new URLSearchParams({
    pinType: "alert",
    id: String(alert.id),
    zoom: "14",
  });
  if (Number.isFinite(Number(alert.lat)) && Number.isFinite(Number(alert.lng))) {
    params.set("lat", String(alert.lat));
    params.set("lng", String(alert.lng));
  }
  return `/map?${params.toString()}`;
};

const dedupeById = (items = []) => {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
};

const prependUniqueById = (items = [], nextItem) => {
  if (!nextItem?.id) return items;
  return [nextItem, ...items.filter((item) => item.id !== nextItem.id)];
};

const imageForAlert = (alert) =>
  alert.photoUrl || ALERT_SAMPLE_IMAGES[alert.type] || ALERT_SAMPLE_IMAGES.OTHER;

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState("ALL");
  const [severity, setSeverity] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(AlertSchema),
    defaultValues: { severity: "MEDIUM", type: "FLOOD", lat: 7.8731, lng: 80.7718 },
  });

  const fetchAlerts = useCallback(async (type = "ALL", sev = "ALL", pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status: "ACTIVE", page: pg, limit: PAGE_SIZE });
      if (type !== "ALL") params.set("type", type);
      if (sev !== "ALL") params.set("severity", sev);
      const { data } = await axios.get(`/api/alerts?${params}`);
      const items = data.data?.items ?? [];
      // Sort: CRITICAL first, then by createdAt desc
      items.sort((a, b) => {
        const sevDiff = (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4);
        if (sevDiff !== 0) return sevDiff;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setAlerts(dedupeById(items));
      setTotal(data.data?.total ?? 0);
    } catch {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts(activeType, severity, page);
  }, [activeType, severity, page, fetchAlerts]);

  useSocket(
    "new:alert",
    useCallback((alert) => {
      if (activeType !== "ALL" && alert.type !== activeType) return;
      setAlerts((prev) => prependUniqueById(prev, alert));
      setTotal((t) => t + 1);
    }, [activeType])
  );

  useSocket(
    "update:alert",
    useCallback((updated) => {
      setAlerts((prev) => {
        if (updated.status !== "ACTIVE") return prev.filter((a) => a.id !== updated.id);
        return prev.map((a) => (a.id === updated.id ? updated : a));
      });
    }, [])
  );

  useSocket(
    "alert:escalated",
    useCallback((data) => {
      toast.warning(`Alert escalated to CRITICAL: ${data.title ?? "Multiple reports in same area"}`, {
        duration: 6000,
      });
    }, [])
  );

  const onTabChange = (val) => {
    setActiveType(val);
    setPage(1);
  };

  const onSeverityChange = (val) => {
    setSeverity(val);
    setPage(1);
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const { data } = await axios.post("/api/alerts", values);
      setAlerts((prev) => prependUniqueById(prev, data.data));
      setTotal((t) => t + 1);
      toast.success("Alert reported successfully");
      reset({ severity: "MEDIUM", type: "FLOOD", lat: 7.8731, lng: 80.7718 });
      setShowModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.error ?? "Failed to submit alert");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex h-[100dvh] bg-slate-50 overflow-hidden text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar title="Threat Alerts">
          <Button
            size="sm"
            onClick={() => setShowModal(true)}
            className="bg-red-600 hover:bg-red-700 text-white gap-1.5 rounded-lg shadow-sm shadow-red-200"
          >
            <AlertTriangle className="w-4 h-4" />
            Report Alert
          </Button>
        </TopBar>

        <main className="flex-1 overflow-y-auto px-6 py-8 motion-fade-up">
          <div className="max-w-4xl">
          <div className="mb-10">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Active Threat Alerts</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              Real-time early warnings and critical threat broadcasts from meteorological and disaster
              management authorities.
            </p>
          </div>

          {/* Filters row */}
          <div className="hidden flex-col sm:flex-row gap-4 mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <Tabs value={activeType} onValueChange={onTabChange} className="flex-1">
              <TabsList className="bg-slate-50 border border-slate-200 flex-wrap h-auto gap-1 p-1">
                {TYPES.map((t) => (
                  <TabsTrigger
                    key={t}
                    value={t}
                    className="text-xs font-semibold uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-blue-700 text-slate-500 transition-all duration-200 rounded-md py-1.5 px-3"
                  >
                    {t.replace("_", " ")}
                    {t === activeType && !loading && (
                      <span className="ml-2 inline-flex items-center justify-center bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                        {total}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Select value={severity} onValueChange={onSeverityChange}>
              <SelectTrigger aria-label="Filter by severity" className="w-full sm:w-[180px] bg-white border-slate-200 text-slate-900 h-10 font-semibold text-xs uppercase tracking-wider">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)]">
                {SEVERITIES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs uppercase tracking-wider font-semibold text-[var(--text-primary)] focus:bg-[var(--bg-elevated)] focus:text-[var(--text-primary)]">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-[var(--bg-surface)] rounded-xl p-5 border border-[var(--border)] space-y-4">
                  <Skeleton className="h-5 w-1/3 rounded-md" />
                  <Skeleton className="h-6 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-2/3 rounded-md" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid max-w-7xl grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(alerts.length ? alerts.slice(0, 3) : [
                { id: "1", title: "Flood Warning", type: "FLOOD", severity: "HIGH", location: "Kelani River Basin", description: "Water levels rising rapidly. Evacuation recommended for low-lying areas.", lat: 6.9271, lng: 79.8612, createdAt: new Date(Date.now() - 10 * 60_000).toISOString(), icon: CloudRain },
                { id: "2", title: "Landslide Risk", type: "LANDSLIDE", severity: "CRITICAL", location: "Ratnapura District", description: "Red alert issued by NBRO. Immediate evacuation required.", lat: 6.6828, lng: 80.3992, createdAt: new Date(Date.now() - 3600_000).toISOString(), icon: AlertTriangle },
                { id: "3", title: "High Winds", type: "OTHER", severity: "MEDIUM", location: "Coastal Belt", description: "Wind speeds up to 60kmph expected. Fishermen advised not to venture out.", lat: 6.0535, lng: 80.221, createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(), icon: Wind },
              ]).map((alert, index) => {
                const Icon = alert.icon || (alert.type === "FLOOD" ? CloudRain : alert.type === "LANDSLIDE" ? AlertTriangle : Wind);
                const critical = alert.severity === "CRITICAL" || alert.severity === "HIGH";
                const alertImage = imageForAlert(alert);
                return (
                  <div
                    key={alert.id}
                    className={`rounded-2xl border bg-white p-5 shadow-sm ${critical ? "border-red-200" : "border-amber-200"}`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${critical ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${critical ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
                          {alert.severity === "CRITICAL" ? "Critical" : alert.severity === "HIGH" ? "High" : "Moderate"}
                        </span>
                      </div>
                      <div className="mt-4 flex items-start justify-between gap-3">
                        <h3 className="text-base font-semibold leading-6 text-slate-900">{alert.title}</h3>
                        <span className="text-xs font-medium text-slate-400">{index === 0 ? "10 mins ago" : index === 1 ? "1 hour ago" : "3 hours ago"}</span>
                      </div>
                      <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <ShieldAlert className="h-4 w-4 text-slate-400" />
                        Region: {alert.location}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{alert.description}</p>
                      <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-slate-100">
                        <img
                          src={alertImage}
                          alt={`${alert.title} visual evidence`}
                          className="h-28 w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3">
                        <Link
                          href={mapHrefForAlert(alert)}
                          className="text-xs font-bold text-blue-600 transition hover:text-blue-700"
                          aria-label={`Open ${alert.title} on map`}
                        >
                          Open exact location on map
                        </Link>
                        {alerts.length > 0 && (
                          <FlagButton targetType="ALERT" targetId={alert.id} flagCount={alert.flagCount} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalPages > 1 && !loading && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
                className="border-[var(--border)] text-[var(--text-muted)] gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </Button>
              <span className="text-sm text-[var(--text-muted)]">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
                className="border-[var(--border)] text-[var(--text-muted)] gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
          </div>
        </main>
      </div>

      {/* Report Alert Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)] max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[var(--text-primary)]">Report Threat Alert</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="type" className="text-[var(--text-muted)] text-xs">Alert Type *</Label>
                <Select
                  value={watch("type")}
                  onValueChange={(val) => setValue("type", val)}
                >
                  <SelectTrigger id="type" className="bg-[var(--bg-elevated)] border-[var(--border)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)]">
                    {["LANDSLIDE", "FLOOD", "FIRE", "BUILDING_COLLAPSE"].map((t) => (
                      <SelectItem key={t} value={t} className="text-[var(--text-primary)] focus:bg-[var(--bg-elevated)]">
                        {t.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-xs text-[var(--critical)]">{errors.type.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="severity" className="text-[var(--text-muted)] text-xs">Severity *</Label>
                <Select
                  value={watch("severity")}
                  onValueChange={(val) => setValue("severity", val)}
                >
                  <SelectTrigger id="severity" className="bg-[var(--bg-elevated)] border-[var(--border)]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--bg-surface)] border-[var(--border)]">
                    {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((s) => (
                      <SelectItem key={s} value={s} className="text-[var(--text-primary)] focus:bg-[var(--bg-elevated)]">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-1">
                <Label htmlFor="title" className="text-[var(--text-muted)] text-xs">Title *</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Brief description of the alert"
                  className="bg-[var(--bg-elevated)] border-[var(--border)]"
                />
                {errors.title && <p className="text-xs text-[var(--critical)]">{errors.title.message}</p>}
              </div>

              <div className="col-span-2 space-y-1">
                <Label htmlFor="description" className="text-[var(--text-muted)] text-xs">Description *</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Detailed description..."
                  rows={3}
                  className="bg-[var(--bg-elevated)] border-[var(--border)] resize-none"
                />
                {errors.description && (
                  <p className="text-xs text-[var(--critical)]">{errors.description.message}</p>
                )}
              </div>
              <div className="col-span-2">
                <LocationAssist
                  currentLat={watch("lat")}
                  currentLng={watch("lng")}
                  onLocationSelect={({ lat, lng, address }) => {
                    setValue("lat", lat, { shouldValidate: true });
                    setValue("lng", lng, { shouldValidate: true });
                    if (address) {
                      setValue("location", address, { shouldValidate: true });
                    }
                  }}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="location" className="text-[var(--text-muted)] text-xs">Location *</Label>
                <Input
                  id="location"
                  {...register("location")}
                  placeholder="e.g. Kalutara, Bandaragama"
                  className="bg-[var(--bg-elevated)] border-[var(--border)]"
                />
                {errors.location && (
                  <p className="text-xs text-[var(--critical)]">{errors.location.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="lat" className="text-[var(--text-muted)] text-xs">Latitude *</Label>
                <Input
                  id="lat"
                  type="number"
                  step="any"
                  {...register("lat", { valueAsNumber: true })}
                  placeholder="7.8731"
                  className="bg-[var(--bg-elevated)] border-[var(--border)]"
                />
                {errors.lat && <p className="text-xs text-[var(--critical)]">{errors.lat.message}</p>}
              </div>

              <div className="space-y-1">
                <Label htmlFor="lng" className="text-[var(--text-muted)] text-xs">Longitude *</Label>
                <Input
                  id="lng"
                  type="number"
                  step="any"
                  {...register("lng", { valueAsNumber: true })}
                  placeholder="80.7718"
                  className="bg-[var(--bg-elevated)] border-[var(--border)]"
                />
                {errors.lng && <p className="text-xs text-[var(--critical)]">{errors.lng.message}</p>}
              </div>

              <div className="col-span-2 space-y-1">
                <Label className="text-[var(--text-muted)] text-xs">Photo (optional)</Label>
                <input type="hidden" {...register("photoUrl")} />
                <ImageUpload
                  onUpload={(url) => setValue("photoUrl", url ?? "", { shouldDirty: true, shouldValidate: true })}
                  label="Upload photo"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reporterName" className="text-[var(--text-muted)] text-xs">Your Name *</Label>
                <Input
                  id="reporterName"
                  {...register("reporterName")}
                  placeholder="Your name"
                  className="bg-[var(--bg-elevated)] border-[var(--border)]"
                />
                {errors.reporterName && (
                  <p className="text-xs text-[var(--critical)]">{errors.reporterName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="reporterPhone" className="text-[var(--text-muted)] text-xs">Your Phone *</Label>
                <Input
                  id="reporterPhone"
                  {...register("reporterPhone")}
                  placeholder="+94 77 123 4567"
                  className="bg-[var(--bg-elevated)] border-[var(--border)]"
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
                className="flex-1 border-[var(--border)] text-[var(--text-muted)]"
                onClick={() => { setShowModal(false); reset({ severity: "MEDIUM", type: "FLOOD", lat: 7.8731, lng: 80.7718 }); }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[var(--critical)] hover:bg-[var(--critical)]/80 text-white"
              >
                {submitting ? "Submitting..." : "Submit Alert"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

