import { z } from "zod";

export const createPlatformCatalogSchema = z.object({
  platformName: z
    .string()
    .min(1, "Platform name is required")
    .max(100, "Platform name must be at most 100 characters"),
  logoUrl: z.string().url("Invalid URL").nullable().optional(),
  status: z.enum(["Active", "Hidden"]).default("Active"),
});

export const updatePlatformCatalogSchema = z.object({
  platformName: z
    .string()
    .min(1)
    .max(100, "Platform name must be at most 100 characters")
    .optional(),
  logoUrl: z.string().url("Invalid URL").nullable().optional(),
  status: z.enum(["Active", "Hidden"]).optional(),
});

export type CreatePlatformCatalogInput = z.infer<typeof createPlatformCatalogSchema>;
export type UpdatePlatformCatalogInput = z.infer<typeof updatePlatformCatalogSchema>;
