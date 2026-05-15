import { z } from "zod";

const SRI_LANKA_BOUNDS = {
  lat: { min: 5.85, max: 9.85 },
  lng: { min: 79.5, max: 81.9 },
};

export const MissingPersonSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  age: z.coerce.number().int().min(0).max(120),
  idNumber: z.string().max(20).optional(),
  lastSeenLocation: z
    .string()
    .min(1, "Last seen location is required")
    .max(200),
  lat: z
    .number()
    .finite()
    .min(SRI_LANKA_BOUNDS.lat.min, "Latitude must be within Sri Lanka bounds")
    .max(SRI_LANKA_BOUNDS.lat.max, "Latitude must be within Sri Lanka bounds"),
  lng: z
    .number()
    .finite()
    .min(SRI_LANKA_BOUNDS.lng.min, "Longitude must be within Sri Lanka bounds")
    .max(SRI_LANKA_BOUNDS.lng.max, "Longitude must be within Sri Lanka bounds"),
  photoUrl: z.string().url().optional().or(z.literal("")),
  reporterName: z.string().min(1, "Your name is required").max(100),
  reporterPhone: z.string().min(7, "Valid phone required").max(20),
});

export const MissingPersonUpdateSchema = MissingPersonSchema.partial().extend({
  status: z.enum(["MISSING", "FOUND"]).optional(),
});
