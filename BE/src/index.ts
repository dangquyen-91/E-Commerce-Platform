import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import path from "node:path";
import mongoose from "mongoose";
import connectDB from "@/config/database";
import { env } from "@/config/env";
import { initializeSocket } from "@/config/socket";
import apiRoutes from "@/routes";
import { errorHandler } from "@/middleware/errorHandler";
import { MESSAGES } from "@/constants/messages";
import { schedulerService } from "@/services/scheduler/scheduler.service";
import { PermissionService } from "@/services/auth/permission.service";

const app = express();

// Trust proxy for Render/production (needed for rate limiter + X-Forwarded-For)
app.set("trust proxy", 1);

const isServerless = process.env.VERCEL === "1" || process.env.AWS_LAMBDA_FUNCTION_NAME;
const isProduction = env.nodeEnv === "production";

// Connect to database with caching
let dbConnected = false;
const ensureDbConnection = async () => {
  if (!dbConnected) {
    await connectDB();
    dbConnected = true;

    // Sync permissions on startup (always - needed for role permissions to work)
    try {
      await PermissionService.assignDefaultPermissions();
      console.log("Permissions synced successfully");
    } catch (error) {
      console.error("Failed to sync permissions:", error);
    }
  }
};

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  })
);
app.use(compression());

// Logging - skip in production serverless for speed
if (!isServerless || !isProduction) {
  app.use(morgan(isProduction ? "combined" : "dev", {
    skip: isProduction ? (_req, res) => res.statusCode < 400 : undefined,
  }));
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Ensure DB connection middleware
app.use(async (_req, _res, next) => {
  try {
    await ensureDbConnection();
    next();
  } catch (error) {
    next(error);
  }
});

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
  });
});

// Swagger UI - only in non-serverless (reduces cold start time)
if (!isServerless) {
  const swaggerUi = require("swagger-ui-express");
  const YAML = require("yamljs");
const swaggerFilePath = path.join(__dirname, "..", "swagger.yml");
try {
    const swaggerDocument = YAML.load(swaggerFilePath);
  console.log("Swagger document loaded successfully");

  const swaggerOptions = {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Marketplace API Documentation",
      persistAuthorization: true,
    filter: true,
    validatorUrl: null,
    supportedSubmitMethods: ["get", "post", "put", "delete", "patch"],
    docExpansion: "list" as const,
  };

  app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));
  app.get("/swagger/", (_req, res) => {
    res.redirect("/swagger");
  });
} catch (err) {
  console.warn("Could not load swagger file:", err);
}

  // Static files (uploads) - only for local development
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
}

// API Routes
app.use("/api", apiRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: MESSAGES.ERROR.GENERAL.ROUTE_NOT_FOUND,
  });
});

// Error handler
app.use(errorHandler);

// Create HTTP server and initialize Socket.io
const httpServer = createServer(app);
const io = initializeSocket(httpServer);

// Start server only on non-serverless
if (!isServerless) {
  const startServer = async () => {
    await ensureDbConnection();

    // Start disbursement scheduler (auto-release escrow after 72h)
    schedulerService.startDisbursementScheduler();

const PORT = env.port;
    httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${env.nodeEnv} mode`);
  console.log(`Swagger UI available at http://localhost:${PORT}/swagger`);
      console.log(`WebSocket server ready`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);

      await new Promise<void>((resolve) => httpServer.close(() => resolve()));

      try {
        await mongoose.connection.close(false);
      } catch {
        // ignore
      }

      process.exit(0);
    };

    process.on("SIGINT", () => {
      void shutdown("SIGINT");
    });

    process.on("SIGTERM", () => {
      void shutdown("SIGTERM");
    });
  };

  void startServer();
}

export { io };
export default app;
