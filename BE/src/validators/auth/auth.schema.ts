import { z } from 'zod'
import { VALIDATION_MESSAGES } from '../validation-messages'

// Password validation helper
const passwordSchema = z
  .string()
  .min(8, VALIDATION_MESSAGES.AUTH.PASSWORD_MIN_LENGTH)
  .max(128, VALIDATION_MESSAGES.AUTH.PASSWORD_MAX_LENGTH)
  .regex(/[a-z]/, VALIDATION_MESSAGES.AUTH.PASSWORD_LOWERCASE)
  .regex(/[A-Z]/, VALIDATION_MESSAGES.AUTH.PASSWORD_UPPERCASE)
  .regex(/\d/, VALIDATION_MESSAGES.AUTH.PASSWORD_NUMBER)
  .regex(/[^a-zA-Z0-9]/, VALIDATION_MESSAGES.AUTH.PASSWORD_SPECIAL)

// Auth validation schemas
export const registerSchema = z.object({
  email: z.string().email(VALIDATION_MESSAGES.AUTH.EMAIL_INVALID),
  password: passwordSchema,
  fullName: z
    .string()
    .min(2, VALIDATION_MESSAGES.AUTH.FULL_NAME_MIN)
    .max(100, VALIDATION_MESSAGES.AUTH.FULL_NAME_MAX),
  phone: z.string().optional().nullable()
})

export const loginSchema = z.object({
  email: z.string().email(VALIDATION_MESSAGES.AUTH.EMAIL_INVALID),
  password: z.string().min(1, VALIDATION_MESSAGES.AUTH.PASSWORD_REQUIRED)
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, VALIDATION_MESSAGES.AUTH.REFRESH_TOKEN_REQUIRED)
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, VALIDATION_MESSAGES.AUTH.CURRENT_PASSWORD_REQUIRED),
  newPassword: passwordSchema
})

// Seller registration schema - includes shop information
export const registerSellerSchema = registerSchema.extend({
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