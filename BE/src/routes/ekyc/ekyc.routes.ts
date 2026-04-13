import { Router } from "express";
import multer from "multer";
import { authenticate } from "@/middleware/auth";
import { ekycController } from "@/controllers/ekyc/ekyc.controller";
import { ekycProcessController } from "@/controllers/ekyc/process.controller";
import { ekycSessionController } from "@/controllers/ekyc/session.controller";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

router.post(
  "/upload",
  authenticate,
  upload.single("file"),
  (req, res, next) => {
    if (!req.file) {
      res.status(400).json({ success: false, message: "File is required" });
      return;
    }
    next();
  },
  ekycController.upload
);

router.post("/process", authenticate, ekycProcessController.process);
router.get("/session", authenticate, ekycSessionController.getSession);
router.post("/session/reset", authenticate, ekycSessionController.resetSession);

export default router;
