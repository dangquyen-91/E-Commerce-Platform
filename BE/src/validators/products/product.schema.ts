import { z } from 'zod'
import { VALIDATION_MESSAGES } from '../validation-messages'

// Product validation schemas
export const createProductSchema = z.object({
  shopId: z.string().min(1, VALIDATION_MESSAGES.PRODUCT.SHOP_ID_REQUIRED),
  platformId: z.string().min(1, VALIDATION_MESSAGES.PRODUCT.PLATFORM_ID_REQUIRED),
  title: z
    .string()
    .min(5, VALIDATION_MESSAGES.PRODUCT.TITLE_MIN_LENGTH)
    .max(200, VALIDATION_MESSAGES.PRODUCT.TITLE_MAX_LENGTH),
  description: z.string().min(20, VALIDATION_MESSAGES.PRODUCT.DESCRIPTION_MIN_LENGTH),
  warrantyPolicy: z.string().min(10, VALIDATION_MESSAGES.PRODUCT.WARRANTY_POLICY_MIN_LENGTH),
  howToUse: z.string().min(10, VALIDATION_MESSAGES.PRODUCT.HOW_TO_USE_MIN_LENGTH),
  thumbnailUrl: z.string().url().optional().nullable(),
  planType: z.enum(['Personal', 'Family', 'Slot', 'Shared', 'InviteLink'], {
    message: VALIDATION_MESSAGES.PRODUCT.PLAN_TYPE_INVALID,
  }),
  durationDays: z
    .number()
    .int(VALIDATION_MESSAGES.PRODUCT.DURATION_DAYS_INTEGER)
    .min(1, VALIDATION_MESSAGES.PRODUCT.DURATION_DAYS_MIN),
  price: z.number().min(0, VALIDATION_MESSAGES.PRODUCT.PRICE_MIN),
})

export const updateProductSchema = z.object({
  title: z
    .string()
    .min(5, VALIDATION_MESSAGES.PRODUCT.TITLE_MIN_LENGTH)
    .max(200, VALIDATION_MESSAGES.PRODUCT.TITLE_MAX_LENGTH)
    .optional(),
  description: z.string().min(20, VALIDATION_MESSAGES.PRODUCT.DESCRIPTION_MIN_LENGTH).optional(),
  warrantyPolicy: z
    .string()
    .min(10, VALIDATION_MESSAGES.PRODUCT.WARRANTY_POLICY_MIN_LENGTH)
    .optional(),
  howToUse: z.string().min(10, VALIDATION_MESSAGES.PRODUCT.HOW_TO_USE_MIN_LENGTH).optional(),
  thumbnailUrl: z.string().url().optional().nullable(),
  planType: z.enum(['Personal', 'Family', 'Slot', 'Shared', 'InviteLink'], {
    message: VALIDATION_MESSAGES.PRODUCT.PLAN_TYPE_INVALID,
  }).optional(),
  durationDays: z
    .number()
    .int(VALIDATION_MESSAGES.PRODUCT.DURATION_DAYS_INTEGER)
    .min(1, VALIDATION_MESSAGES.PRODUCT.DURATION_DAYS_MIN)
    .optional(),
  price: z.number().min(0, VALIDATION_MESSAGES.PRODUCT.PRICE_MIN).optional(),
})
