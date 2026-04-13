import mongoose, { Schema, Document } from "mongoose";

export type KycStatus = "PENDING" | "VERIFIED" | "RETRY_REQUIRED";

export interface IKycSession extends Document {
  userId: mongoose.Types.ObjectId;
  status: KycStatus;
  frontHash?: string | null;
  backHash?: string | null;
  selfieHash?: string | null;
  vendor: "VNPT_IDG";
  // Normalized OCR fields
  fullName?: string | null;
  dob?: string | null;
  idNumber?: string | null;
  issueDate?: string | null;
  issuePlace?: string | null;
  address?: string | null;
  // Audit/raw
  ocrFrontRaw?: unknown;
  ocrBackRaw?: unknown;
  cardLivenessRaw?: unknown;
  faceLivenessRaw?: unknown;
  faceCompareRaw?: unknown;
  faceMatchProb?: number | null;
  faceMatchThreshold?: number | null;
  decisionReasons?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const KycSessionSchema = new Schema<IKycSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true,
    },
    status: {
      type: String,
      required: true,
      enum: ["PENDING", "VERIFIED", "RETRY_REQUIRED"],
      default: "PENDING",
      index: true,
    },
    frontHash: { type: String, default: null },
    backHash: { type: String, default: null },
    selfieHash: { type: String, default: null },
    vendor: {
      type: String,
      required: true,
      enum: ["VNPT_IDG"],
      default: "VNPT_IDG",
    },

    fullName: { type: String, default: null },
    dob: { type: String, default: null },
    idNumber: { type: String, default: null },
    issueDate: { type: String, default: null },
    issuePlace: { type: String, default: null },
    address: { type: String, default: null },

    ocrFrontRaw: { type: Schema.Types.Mixed, default: null },
    ocrBackRaw: { type: Schema.Types.Mixed, default: null },
    cardLivenessRaw: { type: Schema.Types.Mixed, default: null },
    faceLivenessRaw: { type: Schema.Types.Mixed, default: null },
    faceCompareRaw: { type: Schema.Types.Mixed, default: null },

    faceMatchProb: { type: Number, default: null },
    faceMatchThreshold: { type: Number, default: null },
    decisionReasons: { type: [String], default: [] },
  },
  { timestamps: true }
);

KycSessionSchema.index({ userId: 1, status: 1 });

export default mongoose.model<IKycSession>("KycSession", KycSessionSchema);
