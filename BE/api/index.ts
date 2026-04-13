// Register @/ path aliases first - Vercel serverless does not resolve @/ at build time
import "./register-paths";

// Load environment variables (for local development)
// In Vercel, env vars are automatically available in process.env
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import cookieParser from "cookie-parser";
import connectDB from "../src/config/database";
import { env } from "../src/config/env";
import apiRoutes from "../src/routes";
import { errorHandler } from "../src/middleware/errorHandler";

const app = express();

// Trust proxy - required when behind Vercel/reverse proxy for express-rate-limit
// (X-Forwarded-For is set by the proxy; without this, express-rate-limit throws ERR_ERL_UNEXPECTED_X_FORWARDED_FOR)
app.set("trust proxy", 1);

// Connect to database
connectDB();

// Middleware
// Configure Helmet for production (allow cookies and cross-origin)
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

// CORS configuration
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) {
      console.log("CORS: Allowing request with no origin");
      return callback(null, true);
    }

    // Get allowed origins from env
    const allowedOrigins: string[] = [];
    
    // Add env CORS_ORIGIN
    if (env.corsOrigin) {
      allowedOrigins.push(env.corsOrigin);
    }
    
    // Add CORS_ORIGIN from env
    if (process.env.CORS_ORIGIN) {
      allowedOrigins.push(process.env.CORS_ORIGIN);
    }
    
    // Add Vercel URL if available
    if (process.env.VERCEL_URL) {
      allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
    }
    
    // Add VERCEL_BRANCH_URL if available (preview deployments)
    if (process.env.VERCEL_BRANCH_URL) {
      allowedOrigins.push(`https://${process.env.VERCEL_BRANCH_URL}`);
    }

    // Allow localhost for development
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      console.log("CORS: Allowing localhost origin:", origin);
      return callback(null, true);
    }

    // Allow all Vercel preview URLs
    if (origin.includes(".vercel.app")) {
      console.log("CORS: Allowing Vercel origin:", origin);
      return callback(null, true);
    }

    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log("CORS: Allowing origin from allowed list:", origin);
      return callback(null, true);
    }

    // Log blocked origin for debugging
    console.warn("CORS: Blocked origin:", origin);
    console.warn("CORS: Allowed origins:", allowedOrigins);
    callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400, // 24 hours
};

app.use(cors(corsOptions));
app.use(compression()); // Compress responses
app.use(morgan("dev")); // Logging
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Health check
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.nodeEnv,
  });
});

// API Routes
app.use("/api", apiRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use(errorHandler);

// Export for Vercel serverless
export default app;
