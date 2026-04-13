import { env } from "@/config/env";

export interface VnptIdgUploadResponse {
  message: string;
  object?: {
    hash?: string;
    fileName?: string;
    title?: string;
    description?: string;
    fileType?: string;
    uploadedDate?: string;
    storageType?: string;
    tokenId?: string;
  };
}

export class EkycService {
  async uploadImageToVnptIdg(params: {
    fileBuffer: Buffer;
    filename: string;
    mimetype: string;
    title?: string;
    description?: string;
  }): Promise<{ hash: string; raw: VnptIdgUploadResponse }> {
    if (!env.ekycAccessToken || !env.ekycTokenId || !env.ekycTokenKey) {
      throw new Error("Missing EKYC credentials (EKYC_ACCESS_TOKEN/EKYC_TOKEN_ID/EKYC_TOKEN_KEY)");
    }

    const form = new FormData();
    // Cast Buffer to BlobPart for Node.js 22+ compatibility
    const blob = new Blob([params.fileBuffer as unknown as BlobPart], { type: params.mimetype });
    form.append("file", blob, params.filename);
    form.append("title", params.title ?? "ekyc_upload");
    form.append("description", params.description ?? "ekyc_upload");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch(`${env.ekycBaseUrl}/file-service/v1/addFile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.ekycAccessToken}`,
          "Token-id": env.ekycTokenId,
          "Token-key": env.ekycTokenKey,
        },
        body: form,
        signal: controller.signal,
      });

      const text = await res.text();
      let data: VnptIdgUploadResponse;
      try {
        data = JSON.parse(text) as VnptIdgUploadResponse;
      } catch {
        throw new Error(`VNPT iDG upload failed (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(`VNPT iDG upload failed (${res.status}): ${data?.message ?? "unknown"}`);
      }

      const hash = data?.object?.hash;
      if (!hash) {
        throw new Error("VNPT iDG upload succeeded but missing object.hash");
      }

      return { hash, raw: data };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const ekycService = new EkycService();

