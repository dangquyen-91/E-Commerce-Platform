import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  port: number;
  nodeEnv: string;
  mongoURI: string;
  jwtSecret: string;
  jwtExpire: string;
  jwtRefreshSecret: string;
  jwtRefreshExpire: string;
  corsOrigin: string;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  vnpayTmnCode: string;
  vnpaySecretKey: string;
  vnpayUrl: string;
  vnpayReturnUrl: string;
  vnpayIpnUrl: string;
  backendUrl: string;
  ekycBaseUrl: string;
  ekycAccessToken: string;
  ekycTokenId: string;
  ekycTokenKey: string;
  ekycMacAddress: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  CRON_SECRET: string;
}

const getEnvConfig = (): EnvConfig => {
  const requiredEnvVars = [
    "MONGODB_URI",
    "JWT_SECRET",
    "JWT_REFRESH_SECRET",
    "VNPAY_TMN_CODE",
    "VNPAY_SECRET_KEY",
    "EKYC_ACCESS_TOKEN",
    "EKYC_TOKEN_ID",
    "EKYC_TOKEN_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];

  const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  return {
    port: Number.parseInt(process.env.PORT || "3001", 10),
    nodeEnv: process.env.NODE_ENV || "development",
    mongoURI: process.env.MONGODB_URI!,
    jwtSecret: process.env.JWT_SECRET!,
    jwtExpire: process.env.JWT_EXPIRE || "7d",
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
    jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || "30d",
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
    rateLimitWindowMs: Number.parseInt(
      process.env.RATE_LIMIT_WINDOW_MS || "900000",
      10
    ),
    rateLimitMaxRequests: Number.parseInt(
      process.env.RATE_LIMIT_MAX_REQUESTS || "100",
      10
    ),
    vnpayTmnCode: process.env.VNPAY_TMN_CODE!,
    vnpaySecretKey: process.env.VNPAY_SECRET_KEY!,
    vnpayUrl:
      process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    vnpayReturnUrl:
      process.env.VNPAY_RETURN_URL || `${process.env.BACKEND_URL || "http://localhost:3001"}/api/payments/vnpay/return`,
    vnpayIpnUrl: process.env.VNPAY_IPN_URL || "",
    backendUrl: process.env.BACKEND_URL || "http://localhost:3001",
    ekycBaseUrl: process.env.EKYC_BASE_URL || "https://api.idg.vnpt.vn",
    ekycAccessToken: process.env.EKYC_ACCESS_TOKEN!,
    ekycTokenId: process.env.EKYC_TOKEN_ID!,
    ekycTokenKey: process.env.EKYC_TOKEN_KEY!,
    ekycMacAddress: process.env.EKYC_MAC_ADDRESS || "TEST1",
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY!,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET!,
    CRON_SECRET: process.env.CRON_SECRET || "default-cron-secret-change-in-production",
  };
};

export const env = getEnvConfig();
