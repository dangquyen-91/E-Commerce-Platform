import { z } from 'zod'
import { VALIDATION_MESSAGES } from '../validation-messages'

// Shop validation schemas
export const createShopSchema = z.object({
  shopName: z
    .string()
    .min(2, VALIDATION_MESSAGES.SHOP.NAME_MIN_LENGTH)
    .max(100, VALIDATION_MESSAGES.SHOP.NAME_MAX_LENGTH),
  description: z
    .string()
    .max(500, VALIDATION_MESSAGES.SHOP.DESCRIPTION_MAX_LENGTH)
    .optional()
    .nullable(),
})

export const updateShopSchema = z.object({
  shopName: z
    .string()
    .min(2, VALIDATION_MESSAGES.SHOP.NAME_MIN_LENGTH)
    .max(100, VALIDATION_MESSAGES.SHOP.NAME_MAX_LENGTH)
    .optional(),
  description: z
    .string()
    .max(500, VALIDATION_MESSAGES.SHOP.DESCRIPTION_MAX_LENGTH)
    .optional()
    .nullable(),
})
