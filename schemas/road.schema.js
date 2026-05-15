import { z } from "zod";

const SRI_LANKA_BOUNDS = {
  lat: { min: 5.85, max: 9.85 },
  lng: { min: 79.5, max: 81.9 },
};

const ImageUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      if (!value) return true;
      if (value.startsWith("/uploads/") || value.startsWith("/samples/")) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    "Image must be an uploaded file or valid URL"
  );

export const RoadAlertSchema = z.object({
  fromLocation: z.string().min(1, "From location is required").max(200),
  toLocation: z.string().min(1, "To location is required").max(200),
  roadName: z.string().min(1, "Road name is required").max(200),
  description: z.string().min(1, "Description is required").max(1000),
  photoUrl: ImageUrlSchema.optional(),
  reporterName: z.string().min(1, "Your name is required").max(100),
  reporterPhone: z.string().min(7, "Valid phone required").max(20),
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
});

export const RoadAlertUpdateSchema = RoadAlertSchema.partial().extend({
  status: z.enum(["ACTIVE", "RESOLVED"]).optional(),
});
