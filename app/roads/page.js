"use client";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Route, Plus } from "lucide-react";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import RoadCard from "@/components/public/RoadCard";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RoadAlertSchema } from "@/schemas/road.schema";
import { useSocket } from "@/hooks/useSocket";
import LocationAssist from "@/components/shared/LocationAssist";

const defaultValues = {
  fromLocation: "",
  toLocation: "",
  roadName: "",
  description: "",
  reporterName: "",
  reporterPhone: "",
  lat: 7.8731,
  lng: 80.7718,
};

export default function RoadsPage() {
  const [roads, setRoads] = useState([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(RoadAlertSchema),
    defaultValues,
  });

  const fetchRoads = useCallback(async () => {
    const { data } = await axios.get("/api/roads?status=ACTIVE&limit=100");
    if (data.success) setRoads(data.data.items);
  }, []);

  useEffect(() => {
    fetchRoads().catch(() => toast.error("Failed to load road alerts"));
  }, [fetchRoads]);

  useSocket(
    "new:roadAlert",
    useCallback((road) => {
      setRoads((prev) => [road, ...prev.filter((item) => item.id !== road.id)]);
    }, [])
  );

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const { data } = await axios.post("/api/roads", values);
      if (data.success) {
        setRoads((prev) => [data.data, ...prev.filter((item) => item.id !== data.data.id)]);
        toast.success("Road alert reported successfully");
        reset(defaultValues);
        setOpen(false);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to submit road alert");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title="Road Alerts">
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={{ backgroundColor: "#ea580c", color: "#ffffff" }}
            className="inline-flex items-center gap-2 rounded-md h-9 px-3 text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm shrink-0"
          >
            <Plus className="h-4 w-4" />
            Report Road Alert
          </button>
        </TopBar>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {roads.map((road) => <RoadCard key={road.id} road={road} />)}
          </div>
        </main>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-orange-600" />
              Report Road Alert
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="From Location" error={errors.fromLocation?.message}>
                <Input placeholder="Colombo" {...register("fromLocation")} />
              </Field>
              <Field label="To Location" error={errors.toLocation?.message}>
                <Input placeholder="Kandy" {...register("toLocation")} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Road Name" error={errors.roadName?.message}>
                  <Input placeholder="A1 Kandy Road" {...register("roadName")} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Description" error={errors.description?.message}>
                  <Textarea
                    rows={3}
                    placeholder="Describe the blockage, flooding, damage, or alternate route."
                    {...register("description")}
                  />
                </Field>
              </div>
              {/* Hidden fields — populated by LocationAssist below */}
              <input type="hidden" {...register("lat", { valueAsNumber: true })} />
              <input type="hidden" {...register("lng", { valueAsNumber: true })} />
              <div className="sm:col-span-2">
                <LocationAssist
                  currentLat={watch("lat")}
                  currentLng={watch("lng")}
                  onLocationSelect={({ lat, lng }) => {
                    setValue("lat", lat, { shouldValidate: true });
                    setValue("lng", lng, { shouldValidate: true });
                  }}
                />
                {(errors.lat || errors.lng) && (
                  <p className="text-xs text-[var(--critical)] mt-1">
                    {errors.lat?.message || errors.lng?.message}
                  </p>
                )}
              </div>
              <Field label="Your Name" error={errors.reporterName?.message}>
                <Input placeholder="Your name" {...register("reporterName")} />
              </Field>
              <Field label="Phone" error={errors.reporterPhone?.message}>
                <Input placeholder="+94 77 123 4567" {...register("reporterPhone")} />
              </Field>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  reset(defaultValues);
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1 bg-orange-600 text-white hover:bg-orange-700">
                {submitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-[var(--critical)]">{error}</p>}
    </div>
  );
}
