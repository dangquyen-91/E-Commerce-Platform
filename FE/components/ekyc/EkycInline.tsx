"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ekycService, type EkycDocumentType, type EkycSessionResponse } from "@/lib/services/ekyc.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  UploadCloud,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Camera,
  X,
} from "lucide-react";

const buildClientSession = () => {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "web";
  const shortUa = ua.replace(/\s+/g, " ").slice(0, 80);
  return `WEB_${shortUa}`;
};

const uuid = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

type DocState = {
  file: File | null;
  previewUrl: string | null;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
};

type Props = {
  onVerified?: () => void;
};

type DocMeta = { id: EkycDocumentType; title: string; subtitle: string };
type ReasonCode = "CARD_LIVENESS_FAILED" | "FACE_LIVENESS_FAILED" | "FACE_COMPARE_FAILED" | "FACE_MISMATCH";

type ReasonMapping = {
  message: string;
  docs: EkycDocumentType[];
};

const DOCS: DocMeta[] = [
  { id: "front", title: "Bước 1: CCCD/CMND mặt trước", subtitle: "Chụp rõ, không lóa." },
  { id: "back", title: "Bước 2: CCCD/CMND mặt sau", subtitle: "Chụp rõ, không lóa." },
  { id: "selfie", title: "Bước 3: Ảnh chân dung (Selfie)", subtitle: "Chụp rõ mặt, đủ ánh sáng." },
];

const REASON_MAPPINGS: Record<ReasonCode, ReasonMapping> = {
  CARD_LIVENESS_FAILED: {
    message: "Bước 1 lỗi: Ảnh mặt trước giấy tờ chưa rõ hoặc không đạt kiểm tra thật/giả.",
    docs: ["front"],
  },
  FACE_LIVENESS_FAILED: {
    message: "Bước 3 lỗi: Ảnh selfie chưa đạt kiểm tra khuôn mặt sống (liveness).",
    docs: ["selfie"],
  },
  FACE_COMPARE_FAILED: {
    message: "Bước 3 lỗi: Khuôn mặt selfie chưa khớp với ảnh giấy tờ.",
    docs: ["front", "selfie"],
  },
  FACE_MISMATCH: {
    message: "Bước 3 lỗi: Khuôn mặt selfie chưa khớp với ảnh giấy tờ.",
    docs: ["front", "selfie"],
  },
};

const parseReasonsToDocErrors = (reasons?: string[]) => {
  const docErrors: Partial<Record<EkycDocumentType, string>> = {};

  (reasons ?? []).forEach((reason) => {
    const mapping = REASON_MAPPINGS[reason as ReasonCode];
    if (!mapping) return;

    mapping.docs.forEach((doc) => {
      if (!docErrors[doc]) {
        docErrors[doc] = mapping.message;
      }
    });
  });

  return docErrors;
};

const statusBadge = (status?: string) => {
  if (status === "VERIFIED") {
    return <Badge className="bg-green-600 hover:bg-green-600">Đã xác minh</Badge>;
  }
  if (status === "RETRY_REQUIRED") {
    return <Badge variant="destructive">Cần chụp lại</Badge>;
  }
  return <Badge variant="secondary">Chưa xác minh</Badge>;
};

export function EkycInline({ onVerified }: Props) {
  const [session, setSession] = useState<EkycSessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docErrors, setDocErrors] = useState<Partial<Record<EkycDocumentType, string>>>({});

  // Camera states for selfie
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // hidden fields required by VNPT
  const [token] = useState<string>(() => uuid());
  const [clientSession] = useState<string>(() => buildClientSession());
  const docType = -1;

  const [docs, setDocs] = useState<Record<EkycDocumentType, DocState>>({
    front: { file: null, previewUrl: null, uploading: false, uploaded: false },
    back: { file: null, previewUrl: null, uploading: false, uploaded: false },
    selfie: { file: null, previewUrl: null, uploading: false, uploaded: false },
  });

  const allUploaded = useMemo(() => {
    return docs.front.uploaded && docs.back.uploaded && docs.selfie.uploaded;
  }, [docs.back.uploaded, docs.front.uploaded, docs.selfie.uploaded]);

  const loadSession = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ekycService.getSession();
      setSession(data);
      setDocErrors(data.status === "RETRY_REQUIRED" ? parseReasonsToDocErrors(data.decisionReasons) : {});
      if (data.hashes) {
        setDocs((prev) => ({
          ...prev,
          front: { ...prev.front, uploaded: !!data.hashes?.frontHash },
          back: { ...prev.back, uploaded: !!data.hashes?.backHash },
          selfie: { ...prev.selfie, uploaded: !!data.hashes?.selfieHash },
        }));
      }

      if (data.status === "VERIFIED") {
        onVerified?.();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải phiên eKYC");
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    const el = videoRef.current;
    const stream = el?.srcObject as MediaStream | null;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    if (el) {
      el.srcObject = null;
    }
    setShowCamera(false);
  };

  const startCamera = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Trình duyệt không hỗ trợ camera.");
      return;
    }

    setError(null);
    setCameraStarting(true);
    setShowCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (e) {
      setError("Không thể truy cập camera. Vui lòng cấp quyền và thử lại.");
      setShowCamera(false);
    } finally {
      setCameraStarting(false);
    }
  };

  useEffect(() => {
    void loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
      Object.values(docs).forEach((d) => {
        if (d.previewUrl) URL.revokeObjectURL(d.previewUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPick = (type: EkycDocumentType, file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh hợp lệ");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    setError(null);
    setDocErrors((prev) => ({ ...prev, [type]: undefined }));

    setDocs((prev) => {
      const old = prev[type];
      if (old.previewUrl) URL.revokeObjectURL(old.previewUrl);
      const previewUrl = URL.createObjectURL(file);
      return {
        ...prev,
        [type]: { ...old, file, previewUrl, error: undefined },
      };
    });
  };

  const captureSelfie = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    if (!video.videoWidth || !video.videoHeight) {
      setError("Camera chưa sẵn sàng. Vui lòng thử lại.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Không thể chụp ảnh. Vui lòng thử lại.");
          return;
        }
        const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
        onPick("selfie", file);
        stopCamera();
      },
      "image/jpeg",
      0.9
    );
  };

  const upload = async (type: EkycDocumentType) => {
    const file = docs[type].file;
    if (!file) return;

    setDocs((prev) => ({
      ...prev,
      [type]: { ...prev[type], uploading: true, error: undefined },
    }));
    setError(null);

    try {
      await ekycService.upload(type, file);
      setDocs((prev) => ({
        ...prev,
        [type]: { ...prev[type], uploading: false, uploaded: true },
      }));
      await loadSession();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Tải lên thất bại";
      setError(msg);
      setDocs((prev) => ({
        ...prev,
        [type]: { ...prev[type], uploading: false, error: msg },
      }));
    }
  };

  const scrollToDoc = (type: EkycDocumentType) => {
    if (typeof document === "undefined") return;
    const el = document.getElementById(`ekyc-step-${type}`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const validateBeforeProcess = () => {
    const nextDocErrors: Partial<Record<EkycDocumentType, string>> = {};

    if (!docs.front.uploaded) {
      nextDocErrors.front = "Bước 1 lỗi: Bạn chưa tải lên CCCD/CMND mặt trước.";
    }
    if (!docs.back.uploaded) {
      nextDocErrors.back = "Bước 2 lỗi: Bạn chưa tải lên CCCD/CMND mặt sau.";
    }
    if (!docs.selfie.uploaded) {
      nextDocErrors.selfie = "Bước 3 lỗi: Bạn chưa tải lên ảnh selfie.";
    }

    return nextDocErrors;
  };

  const process = async () => {
    const precheckErrors = validateBeforeProcess();
    if (Object.keys(precheckErrors).length > 0) {
      setDocErrors(precheckErrors);
      setError("Bạn đang thiếu dữ liệu ở một số bước. Vui lòng kiểm tra thông báo lỗi ngay tại từng bước.");
      const firstInvalid = DOCS.find((doc) => precheckErrors[doc.id]);
      if (firstInvalid) {
        scrollToDoc(firstInvalid.id);
      }
      return;
    }

    setProcessing(true);
    setError(null);
    setDocErrors({});

    try {
      const result = await ekycService.process({ client_session: clientSession, token, type: docType });
      if (result.status === "RETRY_REQUIRED") {
        const stepErrors = parseReasonsToDocErrors(result.reasons);
        setDocErrors(stepErrors);
        setError("Xác minh không thành công. Vui lòng kiểm tra lỗi ở từng bước bên dưới.");
        const firstInvalid = DOCS.find((doc) => stepErrors[doc.id]);
        if (firstInvalid) {
          scrollToDoc(firstInvalid.id);
        }
      }
      await loadSession();
    } catch (e: any) {
      const msg =
        e instanceof Error
          ? e.message
          : typeof e?.message === "string"
            ? e.message
            : typeof e?.response?.data?.message === "string"
              ? e.response.data.message
              : "Xử lý thất bại";
      setError(msg);
    } finally {
      setProcessing(false);
    }
  };

  const reset = async () => {
    setError(null);
    try {
      await ekycService.resetSession();
      setDocs((prev) => ({
        ...prev,
        front: { file: null, previewUrl: null, uploading: false, uploaded: false },
        back: { file: null, previewUrl: null, uploading: false, uploaded: false },
        selfie: { file: null, previewUrl: null, uploading: false, uploaded: false },
      }));
      await loadSession();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể đặt lại eKYC");
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/40">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Xác thực eKYC
            </CardTitle>
            <CardDescription>Bắt buộc trước khi tạo shop.</CardDescription>
          </div>
          {statusBadge(session?.status)}
        </div>

        <div className="text-xs text-muted-foreground mt-2">
          {loading
            ? "Đang tải trạng thái..."
            : session?.status === "VERIFIED"
              ? "Bạn đã xác minh thành công."
              : "Vui lòng tải lên mặt trước, mặt sau và selfie, sau đó bấm Xác minh."}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {session?.status === "RETRY_REQUIRED" ? (
          <Alert>
            <AlertTitle>Cần xác minh lại</AlertTitle>
            <AlertDescription>
              {Object.values(docErrors).filter(Boolean).length > 0
                ? Object.values(docErrors)
                    .filter(Boolean)
                    .join(" ")
                : "Vui lòng chụp lại ảnh và thử lại."}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-3">
          {DOCS.map((m) => {
            const state = docs[m.id];
            const isSelfie = m.id === "selfie";

            return (
              <Card
                id={`ekyc-step-${m.id}`}
                key={m.id}
                className={`p-3 ${docErrors[m.id] ? "border-red-500" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                    <div className="text-sm font-medium truncate">{m.title}</div>
                      {docErrors[m.id] ? <Badge variant="destructive">Sai bước này</Badge> : null}
                    </div>
                    <div className="text-xs text-muted-foreground">{m.subtitle}</div>
                  </div>

                  {state.uploaded ? (
                    <Badge className="bg-green-600 hover:bg-green-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Đã tải
                    </Badge>
                  ) : (
                    <Button size="sm" onClick={() => upload(m.id)} disabled={state.uploading || !state.file}>
                      {state.uploading ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Đang tải
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <UploadCloud className="h-3 w-3" />
                          Tải lên
                        </span>
                      )}
                    </Button>
                  )}
                </div>

                {!state.uploaded ? (
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_180px] md:items-start">
                    <div className="space-y-2">
                      {isSelfie ? (
                        <div className="flex gap-2">
                          <Button type="button" variant="outline" onClick={startCamera} className="flex-1">
                            <Camera className="h-4 w-4 mr-2" />
                            Mở camera
                          </Button>
                          <Input type="file" accept="image/*" onChange={(e) => onPick(m.id, e.target.files?.[0] ?? null)} className="flex-1" />
                        </div>
                      ) : (
                        <Input type="file" accept="image/*" onChange={(e) => onPick(m.id, e.target.files?.[0] ?? null)} />
                      )}
                      {docErrors[m.id] ? <div className="text-xs text-red-600">{docErrors[m.id]}</div> : null}
                      {state.error ? <div className="text-xs text-red-600">{state.error}</div> : null}
                    </div>

                    {state.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={state.previewUrl} alt={`${m.id} preview`} className="h-24 w-full rounded border object-cover" />
                    ) : (
                      <div className="h-24 w-full rounded border bg-muted/30 flex items-center justify-center text-xs text-muted-foreground">
                        Preview
                      </div>
                    )}
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>

        {showCamera ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <Card className="w-full max-w-xl overflow-hidden">
              <CardHeader className="py-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">Chụp ảnh Selfie</CardTitle>
                <Button type="button" variant="ghost" size="icon" onClick={stopCamera}>
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative bg-black aspect-video">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} className="hidden" />
                  {cameraStarting ? (
                    <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
                      Đang mở camera...
                    </div>
                  ) : null}
                </div>
                <div className="p-4 flex justify-center">
                  <Button type="button" onClick={captureSelfie} disabled={cameraStarting}>
                    <Camera className="h-4 w-4 mr-2" />
                    Chụp ảnh
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        <Separator />

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={reset} disabled={processing}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={process} disabled={processing}>
            {processing ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xác minh...
              </span>
            ) : (
              "Xác minh"
            )}
          </Button>
        </div>

        {session?.ocr ? (
          <Card className="p-3 bg-muted/30">
            <div className="text-sm font-medium mb-2">Thông tin OCR</div>
            <div className="text-sm grid grid-cols-1 gap-2 md:grid-cols-2">
              <div>
                <span className="font-medium">Họ tên:</span> {session.ocr.fullName ?? "-"}
              </div>
              <div>
                <span className="font-medium">Ngày sinh:</span> {session.ocr.dob ?? "-"}
              </div>
              <div>
                <span className="font-medium">Số giấy tờ:</span> {session.ocr.idNumber ?? "-"}
              </div>
              <div>
                <span className="font-medium">Ngày cấp:</span> {session.ocr.issueDate ?? "-"}
              </div>
              <div className="md:col-span-2">
                <span className="font-medium">Nơi cấp:</span> {session.ocr.issuePlace ?? "-"}
              </div>
              <div className="md:col-span-2">
                <span className="font-medium">Địa chỉ:</span> {session.ocr.address ?? "-"}
              </div>
            </div>
          </Card>
        ) : null}
      </CardContent>
    </Card>
  );
}
