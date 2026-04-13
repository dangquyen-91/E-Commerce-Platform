/**
 * Validation Messages Constants
 * All validation messages centralized here for easy management and changes
 * 
 * Note: For system-wide messages (success, error), use MESSAGES from @/constants/messages
 */

export const VALIDATION_MESSAGES = {
  // Authentication
  AUTH: {
    EMAIL_INVALID: 'Invalid email',
    PASSWORD_REQUIRED: 'Password is required',
    PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
    PASSWORD_MAX_LENGTH: 'Password must not exceed 128 characters',
    PASSWORD_LOWERCASE: 'Password must contain at least one lowercase letter',
    PASSWORD_UPPERCASE: 'Password must contain at least one uppercase letter',
    PASSWORD_NUMBER: 'Password must contain at least one number',
    PASSWORD_SPECIAL: 'Password must contain at least one special character',
    FULL_NAME_MIN: 'Full name must be at least 2 characters',
    FULL_NAME_MAX: 'Full name must not exceed 100 characters',
    REFRESH_TOKEN_REQUIRED: 'Refresh token is required',
    CURRENT_PASSWORD_REQUIRED: 'Current password is required',
  },

  // User
  USER: {
    FULL_NAME_MIN: 'Full name must be at least 2 characters',
    FULL_NAME_MAX: 'Full name must not exceed 100 characters',
    PHONE_INVALID: 'Phone number must be 10-11 digits',
    AVATAR_URL_INVALID: 'Invalid avatar URL',
  },

  // Product
  PRODUCT: {
    SHOP_ID_REQUIRED: 'Shop ID is required',
    PLATFORM_ID_REQUIRED: 'Platform ID is required',
    TITLE_MIN_LENGTH: 'Title must be at least 5 characters',
    TITLE_MAX_LENGTH: 'Title must not exceed 200 characters',
    DESCRIPTION_MIN_LENGTH: 'Description must be at least 20 characters',
    WARRANTY_POLICY_MIN_LENGTH: 'Warranty policy must be at least 10 characters',
    HOW_TO_USE_MIN_LENGTH: 'How to use must be at least 10 characters',
    PLAN_TYPE_INVALID: 'Plan type must be one of: Personal, Family, Slot, Shared, InviteLink',
    DURATION_DAYS_MIN: 'Duration days must be at least 1',
    DURATION_DAYS_INTEGER: 'Duration days must be an integer',
    PRICE_MIN: 'Price must be greater than or equal to 0',
  },

  // Shop
  SHOP: {
    NAME_MIN_LENGTH: 'Shop name must be at least 2 characters',
    NAME_MAX_LENGTH: 'Shop name must not exceed 100 characters',
    DESCRIPTION_MAX_LENGTH: 'Description must not exceed 500 characters',
  },
} as const;
