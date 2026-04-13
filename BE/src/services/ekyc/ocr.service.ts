import { vnptIdgClient } from "@/services/ekyc/vnpt-idg.client";

export type VnptOcrIdType = -1 | 5 | 6 | 7;

export class OcrService {
  ocrFront(params: {
    img_front: string;
    client_session: string;
    type?: VnptOcrIdType;
    validate_postcode?: boolean;
    token?: string;
  }) {
    return vnptIdgClient.postJson<any>("/ai/v1/ocr/id/front", {
      img_front: params.img_front,
      client_session: params.client_session,
      type: params.type,
      validate_postcode: params.validate_postcode,
      token: params.token,
    });
  }

  ocrBack(params: {
    img_back: string;
    client_session: string;
    type?: VnptOcrIdType;
    validate_postcode?: boolean;
    token?: string;
  }) {
    return vnptIdgClient.postJson<any>("/ai/v1/ocr/id/back", {
      img_back: params.img_back,
      client_session: params.client_session,
      type: params.type,
      validate_postcode: params.validate_postcode,
      token: params.token,
    });
  }
}

export const ocrService = new OcrService();
