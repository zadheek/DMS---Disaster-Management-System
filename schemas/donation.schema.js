import { z } from "zod";

export const DonationPledgeSchema = z.object({
  donorName: z.string().min(1, "Name is required").max(100),
  donorPhone: z.string().min(7, "Valid phone required").max(20),
  amount: z.number().positive().optional().nullable(),
  donationType: z.enum(["CASH", "FOOD", "CLOTHES", "MEDICINE", "OTHER"]),
  message: z.string().max(500).optional().or(z.literal("")),
});

export const DonationDriveSchema = z.object({
  organizationName: z
    .string()
    .min(1, "Organization name is required")
    .max(200),
  description: z.string().min(1, "Description is required").max(1000),
  needs: z
    .array(z.enum(["CASH", "FOOD", "CLOTHES", "MEDICINE", "OTHER"]))
    .min(1, "Select at least one need"),
  bankDetails: z.string().max(500).optional().or(z.literal("")),
  externalLink: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
});
