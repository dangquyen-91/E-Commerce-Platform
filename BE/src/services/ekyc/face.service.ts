import { vnptIdgClient } from "@/services/ekyc/vnpt-idg.client";

export class FaceService {
  cardLiveness(params: { img: string; client_session: string; token?: string }) {
    return vnptIdgClient.postJson<any>("/ai/v1/card/liveness", {
      img: params.img,
      client_session: params.client_session,
      token: params.token,
    });
  }

  faceLiveness(params: { img: string; client_session: string; token: string }) {
    return vnptIdgClient.postJson<any>("/ai/v1/face/liveness", {
      img: params.img,
      client_session: params.client_session,
      token: params.token,
    });
  }

  faceCompare(params: { img_front: string; img_face: string; client_session: string; token: string }) {
    return vnptIdgClient.postJson<any>("/ai/v1/face/compare", {
      img_front: params.img_front,
      img_face: params.img_face,
      client_session: params.client_session,
      token: params.token,
    });
  }
}

export const faceService = new FaceService();
