import { apiClient } from "../api";

export interface UploadResponse {
  filename: string;
  mimetype: string;
  size: number;
  width: number;
  height: number;
  url: string;
  publicId: string;
}

export const uploadService = {
  /**
   * Upload a single file (for general use - complaints, reviews, etc.)
   */
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<UploadResponse>("/uploads/general", formData);

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Upload failed");
  },

  /**
   * Upload product image (for sellers - requires PRODUCT_CREATE permission)
   */
  async uploadProductImage(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<UploadResponse>("/uploads/image", formData);

    if (response.success && response.data) {
      return response.data;
    }
    throw new Error(response.message || "Upload failed");
  },

  /**
   * Upload multiple files
   */
  async uploadFiles(files: File[]): Promise<UploadResponse[]> {
    const results: UploadResponse[] = [];

    for (const file of files) {
      const result = await this.uploadFile(file);
      results.push(result);
    }

    return results;
  },
};
