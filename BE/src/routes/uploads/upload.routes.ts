import { Router } from "express";
import { authenticate, checkPermission } from "@/middleware";
import { PERMISSIONS } from "@/constants/permissions";
import { wrapRequestHandler } from "@/utils/handlers";
import { UploadController } from "@/controllers/uploads/upload.controller";
import { uploadImage } from "@/config/multer";

const router = Router();
const uploadController = new UploadController();

// Upload single image (for sellers - product images)
router.post(
  "/image",
  authenticate,
  checkPermission(PERMISSIONS.PRODUCT_CREATE),
  uploadImage.single("file"),
  wrapRequestHandler(uploadController.uploadSingle)
);

// General upload for authenticated users (complaints, reviews, etc.)
router.post(
  "/general",
  authenticate,
  uploadImage.single("file"),
  wrapRequestHandler(uploadController.uploadSingle)
);

export default router;
