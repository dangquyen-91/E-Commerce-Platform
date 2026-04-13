import { Response } from "express";
import { AuthRequest } from "@/middleware/auth";
import { kycSessionService } from "@/services/ekyc/kyc-session.service";
import { ocrService } from "@/services/ekyc/ocr.service";
import { faceService } from "@/services/ekyc/face.service";
import { normalizeOcr } from "@/utils/ekyc-mappers";

export class EkycProcessController {
  process = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
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

    if (!session.frontHash || !session.backHash) {
      res.status(400).json({
        success: false,
        message: "Missing required hashes (front/back). Please upload both images first.",
      });
      return;
    }

      if (!session.selfieHash) {
        res.status(400).json({
          success: false,
          message: "Missing required hash (selfie). Please upload selfie image first.",
        });
        return;
      }

    const client_session = (req.body?.client_session ?? "") as string;
    const token = (req.body?.token ?? "") as string;
    const type = req.body?.type as any;

    if (!client_session) {
      res.status(400).json({ success: false, message: "client_session is required" });
      return;
    }

    if (!token) {
      res.status(400).json({ success: false, message: "token is required" });
      return;
    }

      const [ocrFrontRaw, ocrBackRaw, cardLivenessRaw, faceLivenessRaw, faceCompareRaw] =
        await Promise.all([
          ocrService.ocrFront({ img_front: session.frontHash, client_session, token, type }),
          ocrService.ocrBack({ img_back: session.backHash, client_session, token, type }),
          faceService.cardLiveness({
            img: session.frontHash,
            client_session,
            token,
          } as Parameters<typeof faceService.cardLiveness>[0]),
          faceService.faceLiveness({ img: session.selfieHash, client_session, token }),
          faceService.faceCompare({
            img_front: session.frontHash,
            img_face: session.selfieHash,
            client_session,
            token,
          }),
        ]);

    const ocrNormalized = normalizeOcr({ ocrFrontRaw, ocrBackRaw });

    const cardLiveness = String((cardLivenessRaw as any)?.object?.liveness ?? "").toLowerCase();
    const cardOk = cardLiveness === "success";

      const faceLiveness = String((faceLivenessRaw as any)?.object?.liveness ?? "").toLowerCase();
      const faceOk = faceLiveness === "success";

      const probRaw =
        (faceCompareRaw as any)?.object?.prob ??
        (faceCompareRaw as any)?.object?.similarity ??
        (faceCompareRaw as any)?.object?.match_prob ??
        null;
      const thresholdRaw =
        (faceCompareRaw as any)?.object?.threshold ??
        (faceCompareRaw as any)?.object?.match_threshold ??
        null;

      const faceMatchProb = typeof probRaw === "number" ? probRaw : probRaw != null ? Number(probRaw) : null;
      const faceMatchThreshold =
        typeof thresholdRaw === "number" ? thresholdRaw : thresholdRaw != null ? Number(thresholdRaw) : null;

      // Logic compare an toàn theo đúng thang điểm:
      // - Nếu có threshold từ provider: dùng threshold đó.
      // - Nếu không có threshold:
      //   + prob <= 1  => coi là thang 0..1, pass khi >= 0.8
      //   + prob > 1   => coi là thang 0..100, pass khi >= 80
      let compareOk = false;
      if (faceMatchProb != null) {
        if (faceMatchThreshold != null) {
          compareOk = faceMatchProb >= faceMatchThreshold;
        } else {
          compareOk = faceMatchProb <= 1 ? faceMatchProb >= 0.8 : faceMatchProb >= 80;
        }
      } else {
        compareOk = String((faceCompareRaw as any)?.object?.msg ?? "").toLowerCase() === "success";
      }

      const status = cardOk && faceOk && compareOk ? "VERIFIED" : "RETRY_REQUIRED";

      const reasons: string[] = [];
      if (!cardOk) reasons.push("CARD_LIVENESS_FAILED");
      if (!faceOk) reasons.push("FACE_LIVENESS_FAILED");
      if (!compareOk) reasons.push("FACE_COMPARE_FAILED");

    await (session as any).updateOne({
      $set: {
        status,
        decisionReasons: reasons,
        ...ocrNormalized,
        ocrFrontRaw,
        ocrBackRaw,
        cardLivenessRaw,
          faceLivenessRaw,
          faceCompareRaw,
          faceMatchProb,
          faceMatchThreshold,
      },
    });

    res.status(200).json({
      success: status === "VERIFIED",
      data: {
        status,
        reasons,
        ocr: ocrNormalized,
          faceMatch: {
            prob: faceMatchProb,
            threshold: faceMatchThreshold,
          },
      },
    });
    } catch (err: any) {
      res.status(502).json({
        success: false,
        message: err?.message ?? "eKYC processing failed",
      });
    }
  };
}

export const ekycProcessController = new EkycProcessController();
