import { env } from "@/config/env";

export class VnptIdgClient {
  private get headers() {
    if (!env.ekycAccessToken || !env.ekycTokenId || !env.ekycTokenKey) {
      throw new Error("Missing EKYC credentials (EKYC_ACCESS_TOKEN/EKYC_TOKEN_ID/EKYC_TOKEN_KEY)");
    }

    return {
      Authorization: `Bearer ${env.ekycAccessToken}`,
      "Token-id": env.ekycTokenId,
      "Token-key": env.ekycTokenKey,
      "mac-address": env.ekycMacAddress,
    };
  }

  async postJson<T>(path: string, body: unknown, timeoutMs = 15000): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${env.ekycBaseUrl}${path}`, {
        method: "POST",
        headers: {
          ...this.headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const text = await res.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(`VNPT iDG request failed (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(`VNPT iDG request failed (${res.status}): ${data?.message ?? "unknown"}`);
      }

      return data as T;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const vnptIdgClient = new VnptIdgClient();

