"use client";
import { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Sidebar from "@/components/shared/Sidebar";
import TopBar from "@/components/shared/TopBar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VolunteerSchema } from "@/schemas/volunteer.schema";

const SKILLS = ["MEDICAL", "TRANSPORT", "RESCUE", "FOOD", "COMMUNICATION"];

export default function VolunteerPage() {
  const [skills, setSkills] = useState(["RESCUE"]);
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
    resolver: zodResolver(VolunteerSchema),
    defaultValues: { lat: 6.9271, lng: 79.8612, skills: ["RESCUE"] },
  });

  const toggleSkill = (skill) => {
    const next = skills.includes(skill) ? skills.filter((item) => item !== skill) : [...skills, skill];
    setSkills(next);
    setValue("skills", next);
  };

  const onSubmit = async (values) => {
    try {
      await axios.post("/api/volunteers", values);
      toast.success("Volunteer registered successfully");
      reset({ lat: 6.9271, lng: 79.8612, skills: ["RESCUE"] });
      setSkills(["RESCUE"]);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Registration failed");
    }
  };

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar title="Volunteer Registration" />
        <main className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl space-y-4 rounded-lg border border-slate-200 bg-white p-5">
            <Field label="Name" error={errors.name?.message}><Input placeholder="Your name" {...register("name")} /></Field>
            <Field label="Phone" error={errors.phone?.message}><Input placeholder="Phone" {...register("phone")} /></Field>
            <Field label="Email" error={errors.email?.message}><Input placeholder="Email" {...register("email")} /></Field>
            <Field label="Location" error={errors.location?.message}><Input placeholder="Location" {...register("location")} /></Field>
            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="grid grid-cols-2 gap-2">
                {SKILLS.map((skill) => (
                  <label key={skill} className="flex items-center gap-2 rounded-md border border-slate-200 p-2 text-sm">
                    <Checkbox checked={skills.includes(skill)} onCheckedChange={() => toggleSkill(skill)} />
                    {skill}
                  </label>
                ))}
              </div>
              {errors.skills && <p className="text-xs text-[var(--critical)]">{errors.skills.message}</p>}
            </div>
            <Button type="submit" className="bg-blue-600 text-white hover:bg-blue-700">Register</Button>
          </form>
        </main>
      </div>
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
