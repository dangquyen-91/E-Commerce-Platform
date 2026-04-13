import { apiClient } from "../api";

export type EkycDocumentType = "front" | "back" | "selfie";

export type UploadEkycResponse = {
  hash: string;
  documentType: EkycDocumentType;
  kycSessionId: string;
  status: string;
};

export type EkycSessionResponse = {
  exists: boolean;
  status: "PENDING" | "VERIFIED" | "RETRY_REQUIRED";
  hashes?: {
    frontHash?: string | null;
    backHash?: string | null;
    selfieHash?: string | null;
  };
  ocr?: {
    fullName: string | null;
    dob: string | null;
    idNumber: string | null;
    issueDate: string | null;
    issuePlace: string | null;
    address: string | null;
  };
  decisionReasons?: string[];
};

export type EkycProcessRequest = {
  client_session: string;
  token: string;
  type?: number;
};

export type EkycProcessResponse = {
  status: "VERIFIED" | "RETRY_REQUIRED";
  reasons: string[];
  ocr: {
    fullName: string | null;
    dob: string | null;
    idNumber: string | null;
    issueDate: string | null;
    issuePlace: string | null;
    address: string | null;
  };
  faceMatch: {
    prob: number | null;
    threshold: number | null;
  };
};

export const ekycService = {
  async upload(documentType: EkycDocumentType, file: File) {
    const form = new FormData();
    form.append("documentType", documentType);
    form.append("file", file);

    const response = await apiClient.post<UploadEkycResponse>("/ekyc/upload", form);

    if (response.success && response.data) return response.data;
    throw new Error(response.message || "Upload eKYC failed");
  },

  async getSession() {
    const response = await apiClient.get<EkycSessionResponse>("/ekyc/session");
    if (response.success && response.data) return response.data;
    throw new Error(response.message || "Get eKYC session failed");
  },

  async process(payload: EkycProcessRequest) {
    const response = await apiClient.post<EkycProcessResponse>("/ekyc/process", payload);
    if (response.success && response.data) return response.data;
    throw new Error(response.message || "Xác minh eKYC thất bại");
  },

  async resetSession() {
    const response = await apiClient.post<{ status: string }>("/ekyc/session/reset");
    if (response.success && response.data) return response.data;
    throw new Error(response.message || "Reset eKYC session failed");
  },
};
