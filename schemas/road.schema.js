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

const coordinateSchema = (axis, bounds) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") return value;
      const trimmed = value.trim();
      return trimmed === "" ? NaN : Number(trimmed);
    },
    z
      .number({ invalid_type_error: `${axis} is required` })
      .finite(`${axis} must be a valid number`)
      .min(bounds.min, `${axis} must be within Sri Lanka bounds`)
      .max(bounds.max, `${axis} must be within Sri Lanka bounds`)
  );

export const RoadAlertSchema = z.object({
  fromLocation: z.string().trim().min(1, "From location is required").max(200),
  toLocation: z.string().trim().min(1, "To location is required").max(200),
  roadName: z.string().trim().min(1, "Road name is required").max(200),
  description: z.string().trim().min(1, "Description is required").max(1000),
  photoUrl: ImageUrlSchema.optional(),
  reporterName: z.string().trim().min(1, "Your name is required").max(100),
  reporterPhone: z.string().trim().min(7, "Valid phone required").max(20),
  lat: coordinateSchema("Latitude", SRI_LANKA_BOUNDS.lat),
  lng: coordinateSchema("Longitude", SRI_LANKA_BOUNDS.lng),
});

export const RoadAlertUpdateSchema = RoadAlertSchema.partial().extend({
  status: z.enum(["ACTIVE", "RESOLVED"]).optional(),
});
