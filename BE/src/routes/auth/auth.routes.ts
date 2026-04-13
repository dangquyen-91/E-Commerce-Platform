import { Router } from "express";
import { AuthController } from "@/controllers/auth/auth.controller";
import { authenticate } from "@/middleware/auth";
import { authLimiter } from "@/middleware/rateLimiter";
import { wrapRequestHandler } from "@/utils/handlers";

const router = Router();
const authController = new AuthController();

// Public routes
router.post("/register", authLimiter, wrapRequestHandler(authController.register));
router.post("/register/seller", authLimiter, wrapRequestHandler(authController.registerSeller));
router.post("/login", authLimiter, wrapRequestHandler(authController.login));
router.post("/refresh", wrapRequestHandler(authController.refreshToken));
router.post("/logout", wrapRequestHandler(authController.logout));

// Protected routes
router.get("/me", authenticate, wrapRequestHandler(authController.getMe));
router.put("/change-password", authenticate, wrapRequestHandler(authController.changePassword));

export default router;
