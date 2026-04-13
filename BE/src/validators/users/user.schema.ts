import { z } from 'zod'
import { VALIDATION_MESSAGES } from '../validation-messages'

// User validation schemas
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, VALIDATION_MESSAGES.USER.FULL_NAME_MIN)
    .max(100, VALIDATION_MESSAGES.USER.FULL_NAME_MAX)
    .optional(),
  phone: z
    .string()
    .regex(/^\d{10,11}$/, VALIDATION_MESSAGES.USER.PHONE_INVALID)
    .optional()
    .nullable(),
  avatarUrl: z.string().url(VALIDATION_MESSAGES.USER.AVATAR_URL_INVALID).optional().nullable(),
})
