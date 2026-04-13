import { Response } from "express";
import { AuthRequest } from "@/middleware/auth";
import { uploadToCloudinary } from "@/config/cloudinary";

export class UploadController {
  uploadSingle = async (req: AuthRequest, res: Response): Promise<void> => {
    const file = req.file;

    if (!file) {
      res.status(400).json({
        success: false,
        message: "File is required",
      });
      return;
    }

    try {
      // Upload to Cloudinary
      const result = await uploadToCloudinary(file.buffer, "marketplace");

      res.status(201).json({
        success: true,
        data: {
          filename: result.public_id,
          mimetype: `image/${result.format}`,
          size: result.bytes,
          width: result.width,
          height: result.height,
          url: result.secure_url,
          publicId: result.public_id,
        },
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to upload image",
      });
    }
  };
}
