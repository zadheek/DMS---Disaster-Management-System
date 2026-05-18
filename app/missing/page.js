"use client";
import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import MissingPersonCard from "@/components/public/MissingPersonCard";
import ImageUpload from "@/components/shared/ImageUpload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MissingPersonSchema } from "@/schemas/missing.schema";

export default function MissingPage() {
  const [people, setPeople] = useState([]);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(MissingPersonSchema),
    defaultValues: { lat: 6.9271, lng: 79.8612, photoUrl: "" },
  });

  const fetchPeople = useCallback(async () => {
    const { data } = await axios.get("/api/missing?status=MISSING&limit=100");
    if (data.success) setPeople(data.data.items);
  }, []);

  useEffect(() => {
    fetchPeople().catch(() => toast.error("Failed to load missing persons"));
  }, [fetchPeople]);

  const handleClose = (isOpen) => {
    if (!isOpen) reset({ lat: 6.9271, lng: 79.8612, photoUrl: "" });
    setOpen(isOpen);
  };

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const { data } = await axios.post("/api/missing", values);
      setPeople((prev) => [data.data, ...prev]);
      toast.success("Missing person reported successfully");
      reset({ lat: 6.9271, lng: 79.8612, photoUrl: "" });
      setOpen(false);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title="Missing Persons">
          <Button onClick={() => setOpen(true)} className="gap-2 bg-blue-600 text-white hover:bg-blue-700">
            <Users className="h-4 w-4" />
            Report Missing Person
          </Button>
        </TopBar>
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {people.map((person) => <MissingPersonCard key={person.id} person={person} />)}
          </div>
        </main>
      </div>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Report Missing Person</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <Field label="Person Photo" error={errors.photoUrl?.message}>
              <ImageUpload
                label="Upload person photo"
                onUpload={(url) => setValue("photoUrl", url || "", { shouldValidate: true })}
              />
              <p className="text-xs text-slate-500 mt-1">A clear recent photo helps greatly in identification.</p>
            </Field>
            <Field label="Full Name" error={errors.name?.message}><Input placeholder="Full name" {...register("name")} /></Field>
            <Field label="Age" error={errors.age?.message}><Input placeholder="Age" type="number" {...register("age")} /></Field>
            <Field label="ID Number" error={errors.idNumber?.message}><Input placeholder="ID number (optional)" {...register("idNumber")} /></Field>
            <Field label="Last Seen Location" error={errors.lastSeenLocation?.message}><Input placeholder="Last seen location" {...register("lastSeenLocation")} /></Field>
            <Field label="Your Name" error={errors.reporterName?.message}><Input placeholder="Your name" {...register("reporterName")} /></Field>
            <Field label="Phone" error={errors.reporterPhone?.message}><Input placeholder="Phone" {...register("reporterPhone")} /></Field>
            <Button type="submit" disabled={submitting} className="w-full bg-blue-600 text-white hover:bg-blue-700">
              {submitting ? "Submitting…" : "Submit Report"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-[var(--critical)]">{error}</p>}
    </div>
  );
}
