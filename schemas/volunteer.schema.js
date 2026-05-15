import { z } from "zod";

export const VolunteerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  phone: z.string().min(7, "Valid phone required").max(20),
  email: z.string().email().optional().or(z.literal("")),
  location: z.string().min(1, "Location is required").max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  skills: z
    .array(
      z.enum(["MEDICAL", "TRANSPORT", "RESCUE", "FOOD", "COMMUNICATION"])
    )
    .min(1, "Select at least one skill"),
});

export const VolunteerUpdateSchema = VolunteerSchema.partial().extend({
  status: z.enum(["AVAILABLE", "DEPLOYED"]).optional(),
});
