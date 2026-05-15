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

export const AlertSchema = z.object({
  type: z.enum(["LANDSLIDE", "FLOOD", "FIRE", "BUILDING_COLLAPSE", "OTHER"]),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().min(1, "Description is required").max(1000),
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
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  photoUrl: ImageUrlSchema.optional(),
  reporterName: z.string().min(1, "Your name is required").max(100),
  reporterPhone: z.string().min(7, "Valid phone required").max(20),
  expiresAt: z.string().datetime().optional(),
});

export const AlertUpdateSchema = AlertSchema.partial().extend({
  status: z
    .enum(["ACTIVE", "RESOLVED", "REJECTED", "EXPIRED"])
    .optional(),
});
