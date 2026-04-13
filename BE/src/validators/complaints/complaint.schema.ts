import { z } from "zod";

// Complaint categories
const complaintCategorySchema = z.enum([
  "ProductQuality",
  "NotAsDescribed",
  "MissingWrongItems",
  "DeliveryIssues",
  "AccountNotWorking",
  "SellerNotResponding",
  "RefundDispute",
]);

const complaintSubcategorySchema = z.enum([
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
]);

const evidenceTypeSchema = z.enum(["Image", "Video", "Screenshot", "Document"]);

const resolutionTypeSchema = z.enum([
  "None",
  "FullRefund",
  "PartialRefund",
  "Replace",
  "Reject",
]);

const penaltyTypeSchema = z.enum([
  "Warning",
  "TemporarySuspension",
  "PermanentSuspension",
  "Fine",
]);

// Evidence schema
const evidenceSchema = z.object({
  type: evidenceTypeSchema,
  url: z.string().url("URL không hợp lệ"),
  description: z.string().max(500).optional(),
});

// ===== Buyer Schemas =====

// Create complaint
export const createComplaintSchema = z.object({
  orderItemId: z.string().min(1, "OrderItemId là bắt buộc"),
  category: complaintCategorySchema,
  subcategory: complaintSubcategorySchema.optional(),
  title: z
    .string()
    .min(10, "Tiêu đề phải có ít nhất 10 ký tự")
    .max(200, "Tiêu đề không được quá 200 ký tự"),
  content: z
    .string()
    .min(20, "Nội dung phải có ít nhất 20 ký tự")
    .max(2000, "Nội dung không được quá 2000 ký tự"),
  evidence: z.array(evidenceSchema).max(10, "Tối đa 10 bằng chứng").optional(),
});

// Add evidence
export const addEvidenceSchema = z.object({
  type: evidenceTypeSchema,
  url: z.string().url("URL không hợp lệ"),
  description: z.string().max(500, "Mô tả không được quá 500 ký tự").optional(),
});

// File appeal
export const fileAppealSchema = z.object({
  reason: z
    .string()
    .min(20, "Lý do kháng cáo phải có ít nhất 20 ký tự")
    .max(2000, "Lý do kháng cáo không được quá 2000 ký tự"),
  additionalEvidence: z
    .array(evidenceSchema)
    .max(5, "Tối đa 5 bằng chứng bổ sung")
    .optional(),
});

// ===== Seller Schemas =====

export const sellerDecisionSchema = z
  .object({
  decision: z.enum(["APPROVE", "REJECT"]),
  note: z.string().max(1000).optional(),
    evidence: z.array(evidenceSchema).max(10, "Tối đa 10 bằng chứng").optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === "REJECT") {
      if (!data.note || data.note.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["note"],
          message: "Khi từ chối khiếu nại, seller phải nhập lý do",
        });
      }

      if (!data.evidence || data.evidence.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["evidence"],
          message: "Khi từ chối khiếu nại, seller phải cung cấp ít nhất 1 bằng chứng",
        });
      }
    }
});

// ===== Moderator Schemas =====

// Add internal note
export const addInternalNoteSchema = z.object({
  content: z
    .string()
    .min(1, "Nội dung ghi chú là bắt buộc")
    .max(2000, "Nội dung không được quá 2000 ký tự"),
});

// Request more info
export const requestInfoSchema = z.object({
  targetParty: z.enum(["buyer", "seller", "both"]),
  questions: z
    .array(z.string().min(10).max(500))
    .min(1, "Phải có ít nhất 1 câu hỏi")
    .max(5, "Tối đa 5 câu hỏi"),
});

// Make decision
export const makeDecisionSchema = z.object({
  resolutionType: resolutionTypeSchema,
  decisionNote: z
    .string()
    .min(20, "Ghi chú quyết định phải có ít nhất 20 ký tự")
    .max(2000, "Ghi chú quyết định không được quá 2000 ký tự"),
  templateId: z.string().optional(),
  refundAmount: z.number().min(0).optional(),
  sellerPenalty: z
    .object({
      type: penaltyTypeSchema,
      reason: z.string().min(10).max(500),
      duration: z.number().min(1).max(365).optional(), // days
      amount: z.number().min(0).optional(), // VND
    })
    .optional(),
});

// ===== Admin Schemas =====

// Appeal decision
export const appealDecisionSchema = z.object({
  decision: z.enum(["Upheld", "Overturned"]),
  newResolutionType: resolutionTypeSchema.optional(),
  newRefundAmount: z.number().min(0).optional(),
  reason: z
    .string()
    .min(20, "Lý do phải có ít nhất 20 ký tự")
    .max(2000, "Lý do không được quá 2000 ký tự"),
});

// Escalation rules config
export const escalationRulesSchema = z.object({
  sellerResponseHours: z.number().min(12).max(168).default(48),
  highValueThreshold: z.number().min(100000).default(1000000),
  autoEscalateHighValue: z.boolean().default(true),
  autoEscalateOnTimeout: z.boolean().default(true),
  appealWindowHours: z.number().min(24).max(168).default(72),
});

// ===== Query Schemas =====

// Get complaints query
export const getComplaintsQuerySchema = z.object({
  status: z.string().optional(),
  category: complaintCategorySchema.optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional(),
  escalationLevel: z
    .enum([
      "Level2_Moderator",
      "Level3_SeniorMod",
      "Level4_Admin",
    ])
    .optional(),
  assignedToUserId: z.string().optional(),
  isHighValue: z.string().transform((val) => val === "true").optional(),
  sortBy: z
    .enum(["createdAt", "updatedAt", "calculatedPriority", "orderValue"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().min(1).max(100).default(20),
  skip: z.coerce.number().min(0).default(0),
});

// Get queue query
export const getQueueQuerySchema = z.object({
  status: z
    .enum(["InQueue", "Assigned", "InProgress", "Completed"])
    .optional(),
  isHighValue: z.string().transform((val) => val === "true").optional(),
  assignedModeratorId: z.string().optional(),
  sortBy: z
    .enum(["queuePriority", "addedToQueueAt", "orderValue"])
    .default("queuePriority"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().min(1).max(100).default(20),
  skip: z.coerce.number().min(0).default(0),
});

// Export types
export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type AddEvidenceInput = z.infer<typeof addEvidenceSchema>;
export type FileAppealInput = z.infer<typeof fileAppealSchema>;
export type SellerDecisionInput = z.infer<typeof sellerDecisionSchema>;
export type AddInternalNoteInput = z.infer<typeof addInternalNoteSchema>;
export type RequestInfoInput = z.infer<typeof requestInfoSchema>;
export type MakeDecisionInput = z.infer<typeof makeDecisionSchema>;
export type AppealDecisionInput = z.infer<typeof appealDecisionSchema>;
export type EscalationRulesInput = z.infer<typeof escalationRulesSchema>;
export type GetComplaintsQuery = z.infer<typeof getComplaintsQuerySchema>;
export type GetQueueQuery = z.infer<typeof getQueueQuerySchema>;
