import multer from "multer";

// Memory storage for Cloudinary uploads
const storage = multer.memoryStorage();

// Image-only filter (for avatars, thumbnails, logos, review images)
const imageFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    cb(new Error("Only image files are allowed"));
    return;
  }
  cb(null, true);
};

// General file filter (for attachments, evidence - images, videos, PDFs)
const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "video/mp4",
    "video/webm",
    "video/quicktime",
    "application/pdf",
  ];

  if (!allowedTypes.includes(file.mimetype)) {
    cb(new Error("File type not allowed. Allowed: images, videos, PDFs"));
    return;
  }
  cb(null, true);
};

// Upload image only (5MB limit)
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// Upload any allowed file (10MB limit)
export const uploadFile = multer({
  storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
