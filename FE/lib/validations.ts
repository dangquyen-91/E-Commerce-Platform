import { z } from "zod";
import { VALIDATION_MESSAGES } from "./validation-messages";

// Password schema (dùng chung) - mật khẩu mạnh
export const passwordSchema = z
  .string()
  .min(8, VALIDATION_MESSAGES.AUTH.PASSWORD_MIN_LENGTH)
  .max(128, VALIDATION_MESSAGES.AUTH.PASSWORD_MAX_LENGTH)
  .regex(/[a-z]/, VALIDATION_MESSAGES.AUTH.PASSWORD_LOWERCASE)
  .regex(/[A-Z]/, VALIDATION_MESSAGES.AUTH.PASSWORD_UPPERCASE)
  .regex(/\d/, VALIDATION_MESSAGES.AUTH.PASSWORD_NUMBER)
  .regex(/[^a-zA-Z0-9]/, VALIDATION_MESSAGES.AUTH.PASSWORD_SPECIAL);

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email(VALIDATION_MESSAGES.AUTH.EMAIL_INVALID),
  password: z.string().min(1, VALIDATION_MESSAGES.AUTH.PASSWORD_REQUIRED),
});

// Customer registration schema (simple user registration)
export const registerSchema = z
  .object({
    email: z.string().email(VALIDATION_MESSAGES.AUTH.EMAIL_INVALID),
    password: passwordSchema,
    confirmPassword: z.string(),
    name: z
      .string()
      .min(2, VALIDATION_MESSAGES.AUTH.NAME_MIN_LENGTH)
      .max(100, VALIDATION_MESSAGES.AUTH.NAME_MAX_LENGTH),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: VALIDATION_MESSAGES.AUTH.PASSWORD_MISMATCH,
    path: ["confirmPassword"],
  });

// Seller registration schema (minimal - chỉ tên shop bắt buộc)
// Dùng khi chưa đăng nhập - tạo user + shop cùng lúc (dùng chung email)
export const registerSellerSchema = z
  .object({
    email: z.string().email(VALIDATION_MESSAGES.AUTH.EMAIL_INVALID),
    password: passwordSchema,
    confirmPassword: z.string(),
    name: z
      .string()
      .min(2, VALIDATION_MESSAGES.AUTH.NAME_MIN_LENGTH)
      .max(100, VALIDATION_MESSAGES.AUTH.NAME_MAX_LENGTH),
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
  .refine((data) => data.password === data.confirmPassword, {
    message: VALIDATION_MESSAGES.AUTH.PASSWORD_MISMATCH,
    path: ["confirmPassword"],
  });

// Create shop schema (chỉ cần tên shop - dùng khi đã đăng nhập)
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
});

// Update shop schema (all fields optional)
export const updateShopSchema = z.object({
  shopName: z
    .string()
    .min(2, VALIDATION_MESSAGES.SHOP.NAME_MIN_LENGTH)
    .max(100, VALIDATION_MESSAGES.SHOP.NAME_MAX_LENGTH)
    .optional(),
  description: z
    .string()
    .max(500, VALIDATION_MESSAGES.SHOP.DESCRIPTION_MAX_LENGTH)
    .optional(),
});

export type UpdateShopInput = z.infer<typeof updateShopSchema>;

export const verifyEmailSchema = z.object({
  code: z.string().length(6, VALIDATION_MESSAGES.AUTH.VERIFY_CODE_LENGTH),
});

// Product schemas - khớp với BE model
export const createProductSchema = z.object({
  shopId: z.string().min(1, VALIDATION_MESSAGES.PRODUCT.SHOP_REQUIRED),
  platformId: z.string().min(1, VALIDATION_MESSAGES.PRODUCT.PLATFORM_REQUIRED),
  title: z
    .string()
    .min(5, VALIDATION_MESSAGES.PRODUCT.TITLE_MIN_LENGTH)
    .max(200, VALIDATION_MESSAGES.PRODUCT.TITLE_MAX_LENGTH),
  description: z.string().min(20, VALIDATION_MESSAGES.PRODUCT.DESCRIPTION_MIN_LENGTH),
  warrantyPolicy: z.string().min(10, VALIDATION_MESSAGES.PRODUCT.WARRANTY_POLICY_MIN_LENGTH),
  howToUse: z.string().min(10, VALIDATION_MESSAGES.PRODUCT.HOW_TO_USE_MIN_LENGTH),
  thumbnailUrl: z.string().url().optional().nullable(),
  planType: z.enum(["Personal", "Family", "Slot", "Shared", "InviteLink"], {
    message: VALIDATION_MESSAGES.PRODUCT.PLAN_TYPE_REQUIRED,
  }),
  durationDays: z
    .number()
    .min(1, VALIDATION_MESSAGES.PRODUCT.DURATION_DAYS_MIN)
    .max(3650, VALIDATION_MESSAGES.PRODUCT.DURATION_DAYS_MAX),
  price: z.number().min(0, VALIDATION_MESSAGES.PRODUCT.PRICE_MIN),
});

export const updateProductSchema = createProductSchema.partial();

export const aiAssistSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
});

// Order schemas
export const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().min(1, VALIDATION_MESSAGES.ORDER.QUANTITY_MIN),
      })
    )
    .min(1, VALIDATION_MESSAGES.ORDER.ITEMS_EMPTY),
  paymentMethod: z.string(),
});

export const confirmDeliverySchema = z.object({
  subOrderId: z.string(),
  confirmed: z.boolean(),
});

// Ticket schemas
export const createTicketSchema = z.object({
  subOrderId: z.string().optional(),
  category: z.enum([
    "invalid_key",
    "activation_fail",
    "refund_request",
    "technical",
    "other",
  ]),
  subject: z
    .string()
    .min(5, VALIDATION_MESSAGES.TICKET.SUBJECT_MIN_LENGTH)
    .max(200, VALIDATION_MESSAGES.TICKET.SUBJECT_MAX_LENGTH),
  description: z.string().min(20, VALIDATION_MESSAGES.TICKET.DESCRIPTION_MIN_LENGTH),
});

export const replyTicketSchema = z.object({
  ticketId: z.string(),
  message: z.string().min(1, VALIDATION_MESSAGES.TICKET.MESSAGE_REQUIRED),
  isInternal: z.boolean().optional(),
});

// Complaint schemas
export const createComplaintSchema = z.object({
  orderItemId: z.string().min(1, VALIDATION_MESSAGES.COMPLAINT.ORDER_ITEM_REQUIRED),
  title: z
    .string()
    .min(5, VALIDATION_MESSAGES.COMPLAINT.TITLE_MIN_LENGTH)
    .max(200, VALIDATION_MESSAGES.COMPLAINT.TITLE_MAX_LENGTH),
  content: z.string().min(20, VALIDATION_MESSAGES.COMPLAINT.CONTENT_MIN_LENGTH),

  // Match swagger.yml (components/schemas/ComplaintCategory)
  category: z.enum(
    [
      "ProductQuality",
      "NotAsDescribed",
      "MissingWrongItems",
      "DeliveryIssues",
      "AccountNotWorking",
      "SellerNotResponding",
      "RefundDispute",
    ],
    { message: VALIDATION_MESSAGES.COMPLAINT.CATEGORY_REQUIRED }
  ),

  // Match swagger.yml (components/schemas/ComplaintSubcategory)
  subcategory: z
    .enum([
      "ItemDefective",
      "ItemDamaged",
      "DifferentFromPhoto",
      "DifferentSpecifications",
      "MissingItems",
      "WrongItems",
      "NeverDelivered",
      "PartialDelivery",
      "CredentialsInvalid",
      "AccountExpired",
      "AccountAlreadyUsed",
      "NoResponse48h",
      "RefuseRefund",
      "PartialRefundDispute",
    ])
    .optional(),

  // Match swagger.yml evidence array (maxItems: 10)
  evidence: z
    .array(
      z.object({
        type: z.enum(["Image", "Video", "Screenshot", "Document"]),
        url: z.string().url(),
        description: z.string().max(500).optional(),
      })
    )
    .max(10)
    .optional(),
});

export const fileAppealSchema = z.object({
  reason: z.string().min(20, VALIDATION_MESSAGES.COMPLAINT.APPEAL_REASON_MIN),
});

export const makeDecisionSchema = z.object({
  resolution: z.enum([
    "FullRefund",
    "PartialRefund",
    "Replace",
    "Reject",
  ], { message: VALIDATION_MESSAGES.COMPLAINT.RESOLUTION_REQUIRED }),
  reason: z.string().min(10, VALIDATION_MESSAGES.COMPLAINT.DECISION_REASON_MIN),
  refundAmount: z.number().min(0).optional(),
});

// Moderation schemas
export const moderateProductSchema = z.object({
  productId: z.string(),
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
});

// Search/Filter schemas
export const searchProductSchema = z.object({
  query: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(["newest", "price_low", "price_high", "popular"]).optional(),
  page: z.number().min(1, VALIDATION_MESSAGES.SEARCH.PAGE_MIN).default(1),
  limit: z
    .number()
    .min(1, VALIDATION_MESSAGES.SEARCH.LIMIT_MIN)
    .max(100, VALIDATION_MESSAGES.SEARCH.LIMIT_MAX)
    .default(20),
});

// Checkout schemas
export const checkoutSchema = z
  .object({
    paymentMethod: z.enum(["wallet", "other"], {
      message: VALIDATION_MESSAGES.CHECKOUT.PAYMENT_METHOD_REQUIRED,
    }),
    // Optional fields for other payment methods
    cardNumber: z.string().optional(),
    cardHolder: z.string().optional(),
    expiryDate: z.string().optional(),
    cvv: z.string().optional(),
  })
  .refine(
    (data) => {
      // If payment method is "other", validate card fields
      if (data.paymentMethod === "other") {
        return data.cardNumber && data.cardHolder && data.expiryDate && data.cvv;
      }
      return true;
    },
    {
      message: VALIDATION_MESSAGES.CHECKOUT.CARD_INFO_REQUIRED,
      path: ["cardNumber"],
    }
  );

// Wallet schemas
export const depositSchema = z.object({
  amount: z
    .number({
      message: VALIDATION_MESSAGES.WALLET.AMOUNT_REQUIRED,
    })
    .min(50000, VALIDATION_MESSAGES.WALLET.AMOUNT_MIN_DEPOSIT)
    .max(50000000, VALIDATION_MESSAGES.WALLET.AMOUNT_MAX_DEPOSIT)
    .int(VALIDATION_MESSAGES.WALLET.AMOUNT_INTEGER),
  paymentMethod: z.enum(["bank", "vnpay", "momo", "zalopay"], {
    message: VALIDATION_MESSAGES.WALLET.PAYMENT_METHOD_REQUIRED,
  }),
});

export const withdrawalSchema = z.object({
  amount: z
    .number({
      message: VALIDATION_MESSAGES.WALLET.AMOUNT_REQUIRED,
    })
    .min(50000, VALIDATION_MESSAGES.WALLET.AMOUNT_MIN_WITHDRAWAL)
    .max(10000000, VALIDATION_MESSAGES.WALLET.AMOUNT_MAX_WITHDRAWAL)
    .int(VALIDATION_MESSAGES.WALLET.AMOUNT_INTEGER),
  bankAccount: z
    .string()
    .min(10, VALIDATION_MESSAGES.WALLET.BANK_ACCOUNT_MIN)
    .max(20, VALIDATION_MESSAGES.WALLET.BANK_ACCOUNT_MAX),
  bankName: z.string().min(2, VALIDATION_MESSAGES.WALLET.BANK_NAME_REQUIRED),
  accountHolder: z.string().min(2, VALIDATION_MESSAGES.WALLET.ACCOUNT_HOLDER_MIN),
});

// Forgot/Reset Password schemas
export const forgotPasswordSchema = z.object({
  email: z.string().email(VALIDATION_MESSAGES.AUTH.EMAIL_INVALID),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: VALIDATION_MESSAGES.AUTH.PASSWORD_MISMATCH,
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, VALIDATION_MESSAGES.AUTH.PASSWORD_REQUIRED),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: VALIDATION_MESSAGES.AUTH.PASSWORD_MISMATCH,
    path: ["confirmPassword"],
  });

// Type exports for use in components
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type RegisterSellerInput = z.infer<typeof registerSellerSchema>;
export type CreateShopInput = z.infer<typeof createShopSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type AIAssistInput = z.infer<typeof aiAssistSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type ReplyTicketInput = z.infer<typeof replyTicketSchema>;
export type ModerateProductInput = z.infer<typeof moderateProductSchema>;
export type SearchProductInput = z.infer<typeof searchProductSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type DepositInput = z.infer<typeof depositSchema>;
export type WithdrawalInput = z.infer<typeof withdrawalSchema>;
export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type FileAppealInput = z.infer<typeof fileAppealSchema>;
export type MakeDecisionInput = z.infer<typeof makeDecisionSchema>;
