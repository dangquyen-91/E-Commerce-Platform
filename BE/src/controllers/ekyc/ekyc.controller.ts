import { Response } from "express";
import { AuthRequest } from "@/middleware/auth";
import { ekycService } from "@/services/ekyc/ekyc.service";
import { kycSessionService } from "@/services/ekyc/kyc-session.service";

const ALLOWED_TYPES = ["front", "back", "selfie"] as const;
export type EkycDocumentType = (typeof ALLOWED_TYPES)[number];

export class EkycController {
  upload = async (req: AuthRequest, res: Response): Promise<void> => {
    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: "File is required" });
      return;
    }

    const documentType = (req.body?.documentType ?? "") as string;
    if (!ALLOWED_TYPES.includes(documentType as EkycDocumentType)) {
      res.status(400).json({
        success: false,
        message: "documentType must be one of: front, back, selfie",
      });
      return;
    }

    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    if (!file.mimetype.startsWith("image/")) {
      res.status(400).json({ success: false, message: "Only image files are allowed" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      res.status(400).json({ success: false, message: "File too large (max 5MB)" });
      return;
    }

    const title = `ekyc_${documentType}_${userId}`;
    const description = `eKYC upload ${documentType} for user ${userId}`;

    const result = await ekycService.uploadImageToVnptIdg({
      fileBuffer: file.buffer,
      filename: file.originalname || "upload.jpg",
      mimetype: file.mimetype,
      title,
      description,
    });

    const session = await kycSessionService.upsertHash({
      userId,
      documentType: documentType as EkycDocumentType,
      hash: result.hash,
    });

    res.status(201).json({
      success: true,
      data: {
        hash: result.hash,
        documentType,
        kycSessionId: session._id,
        status: session.status,
      },
    });
  };
}

export const ekycController = new EkycController();

