import { Response } from "express";
import { AuthRequest } from "@/middleware/auth";
import { kycSessionService } from "@/services/ekyc/kyc-session.service";
import { KycSession } from "@/models";

export class EkycSessionController {
  getSession = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const session = await kycSessionService.getByUserId(userId);
    if (!session) {
      res.status(200).json({
        success: true,
        data: {
          status: "PENDING",
          exists: false,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        exists: true,
        status: session.status,
        hashes: {
          frontHash: session.frontHash,
          backHash: session.backHash,
          selfieHash: session.selfieHash,
        },
        ocr: {
          fullName: (session as any).fullName ?? null,
          dob: (session as any).dob ?? null,
          idNumber: (session as any).idNumber ?? null,
          issueDate: (session as any).issueDate ?? null,
          issuePlace: (session as any).issuePlace ?? null,
          address: (session as any).address ?? null,
        },
        decisionReasons: (session as any).decisionReasons ?? [],
      },
    });
  };

  resetSession = async (req: AuthRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const session = await kycSessionService.getByUserId(userId);
    if (!session) {
      res.status(404).json({ success: false, message: "KYC session not found" });
      return;
    }

    await KycSession.updateOne(
      { _id: session._id },
      {
        $set: {
          status: "PENDING",
          frontHash: null,
          backHash: null,
          selfieHash: null,
          fullName: null,
          dob: null,
          idNumber: null,
          issueDate: null,
          issuePlace: null,
          address: null,
          ocrFrontRaw: null,
          ocrBackRaw: null,
          cardLivenessRaw: null,
          faceLivenessRaw: null,
          faceCompareRaw: null,
          faceMatchProb: null,
          faceMatchThreshold: null,
          decisionReasons: [],
        },
      }
    );

    res.status(200).json({ success: true, data: { status: "PENDING" } });
  };
}

export const ekycSessionController = new EkycSessionController();

