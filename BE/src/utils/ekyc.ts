export type KycDecision = {
  status: "VERIFIED" | "RETRY_REQUIRED";
  reasons: string[];
};

export const isVnptSuccess = (v: unknown): boolean => {
  const s = (v as any)?.object?.liveness;
  return String(s).toLowerCase() === "success";
};

export const decideKyc = (params: {
  cardLivenessRaw: unknown;
  faceLivenessRaw: unknown;
  faceCompareRaw: unknown;
  thresholdRatio: number; // 0-1
  thresholdPercent: number; // 0-100
}): { decision: KycDecision; prob: number | null; msg: string } => {
  const reasons: string[] = [];

  // Ignore card liveness for demo mode
  const cardOk = isVnptSuccess(params.cardLivenessRaw);
  void cardOk;

  const faceOk = isVnptSuccess(params.faceLivenessRaw);
  if (!faceOk) reasons.push("FACE_LIVENESS_FAILED");

  const msg = String((params.faceCompareRaw as any)?.object?.msg ?? "");
  const probRaw = (params.faceCompareRaw as any)?.object?.prob;
  const prob = Number.isFinite(Number(probRaw)) ? Number(probRaw) : null;

  let match = false;
  if (msg === "MATCH") match = true;
  else if (msg === "NOMATCH") match = false;
  else if (prob !== null) {
    match = prob > 1 ? prob >= params.thresholdPercent : prob >= params.thresholdRatio;
  }

  if (!match) reasons.push("FACE_MISMATCH");

  const status: KycDecision["status"] = reasons.length === 0 ? "VERIFIED" : "RETRY_REQUIRED";

  return { decision: { status, reasons }, prob, msg };
};

