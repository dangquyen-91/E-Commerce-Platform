import mongoose from "mongoose";
import { KycSession } from "@/models";

export type EkycDocumentType = "front" | "back" | "selfie";

export class KycSessionService {
  async upsertHash(params: {
    userId: string;
    documentType: EkycDocumentType;
    hash: string;
  }) {
    const update: Record<string, unknown> = { status: "PENDING", vendor: "VNPT_IDG" };

    if (params.documentType === "front") update.frontHash = params.hash;
    if (params.documentType === "back") update.backHash = params.hash;
    if (params.documentType === "selfie") update.selfieHash = params.hash;

    return KycSession.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(params.userId) },
      { $set: update },
      { upsert: true, new: true }
    );
  }

  async getByUserId(userId: string) {
    return KycSession.findOne({ userId: new mongoose.Types.ObjectId(userId) });
  }
}

export const kycSessionService = new KycSessionService();

