import { z } from "zod";

const SRI_LANKA_BOUNDS = {
  lat: { min: 5.85, max: 9.85 },
  lng: { min: 79.5, max: 81.9 },
};

export const ReliefCampSchema = z.object({
  name: z.string().min(1, "Camp name is required").max(200),
  location: z.string().min(1, "Location is required").max(200),
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
  capacity: z.coerce.number().int().min(1, "Capacity must be at least 1"),
});

export const CampUpdateSchema = ReliefCampSchema.partial().extend({
  status: z.enum(["ACTIVE", "CLOSED"]).optional(),
  currentOccupancy: z.number().int().min(0).optional(),
});

export const CheckInSchema = z.object({
  personName: z.string().min(1, "Name is required").max(100),
  personId: z.string().max(20).optional(),
});

export const CampCheckInSearchSchema = z.object({
  query: z.string().max(100).trim().optional(),
  campId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
