import crypto from "node:crypto";

/**
 * Generate unique order code
 */
export const generateOrderCode = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

/**
 * Generate unique ticket code
 */
export const generateTicketCode = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `TKT-${timestamp}-${random}`;
};

/**
 * Mask sensitive information (for delivery content)
 */
export const maskSecret = (secret: string, type: string): string => {
  if (type === "Account") {
    // Mask email: user@example.com -> u***@example.com
    const [local, domain] = secret.split("@");
    if (local && domain) {
      return `${local[0]}***@${domain}`;
    }
  }
  if (type === "Code" || type === "QR") {
    // Show first 4 and last 4 characters
    if (secret.length > 8) {
      return `${secret.substring(0, 4)}***${secret.substring(secret.length - 4)}`;
    }
  }
  // For InviteLink, show domain only
  if (type === "InviteLink") {
    try {
      const url = new URL(secret);
      return `${url.origin}/***`;
    } catch {
      return "***";
    }
  }
  return "***";
};

/**
 * Calculate safe until date (default 7 days from now)
 */
export const calculateSafeUntil = (days: number = 7): Date => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

/**
 * Format currency (VND)
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
};

// ===== Encryption helpers for sensitive secrets (inventory keys, accounts, codes) =====

// Use a stable 32-byte key derived from ENV (INVENTORY_SECRET_KEY or JWT_SECRET)
const INVENTORY_SECRET_KEY = crypto
  .createHash("sha256")
  .update(process.env.INVENTORY_SECRET_KEY || process.env.JWT_SECRET || "default_inventory_secret")
  .digest()
  .subarray(0, 32);

/**
 * Encrypt a secret using AES-256-GCM.
 * Output format: ivHex:tagHex:cipherHex
 */
export const encryptSecret = (plain: string): string => {
  const iv = crypto.randomBytes(12); // GCM recommended IV size
  const cipher = crypto.createCipheriv("aes-256-gcm", INVENTORY_SECRET_KEY, iv);

  let encrypted = cipher.update(plain, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
};

/**
 * Check if a string looks like a valid hex string
 */
const isValidHex = (str: string): boolean => {
  return /^[0-9a-fA-F]+$/.test(str);
};

/**
 * Check if the value is in encrypted format (ivHex:tagHex:cipherHex)
 * Encrypted format: 24 char iv (12 bytes) : 32 char tag (16 bytes) : variable cipher
 */
const isEncryptedFormat = (value: string): boolean => {
  const parts = value.split(":");
  if (parts.length !== 3) return false;

  const [ivHex, tagHex, dataHex] = parts;
  // IV should be 24 hex chars (12 bytes), tag should be 32 hex chars (16 bytes)
  return (
    ivHex.length === 24 &&
    tagHex.length === 32 &&
    dataHex.length > 0 &&
    isValidHex(ivHex) &&
    isValidHex(tagHex) &&
    isValidHex(dataHex)
  );
};

/**
 * Decrypt a secret previously encrypted with encryptSecret.
 * If the value is not in encrypted format (plain text), returns it as-is.
 * Returns empty string only if decryption of encrypted data fails.
 */
export const decryptSecret = (cipherText: string | undefined | null): string => {
  if (!cipherText || typeof cipherText !== "string") return "";

  // Check if this looks like encrypted data
  if (!isEncryptedFormat(cipherText)) {
    // Not encrypted, return as plain text
    return cipherText;
  }

  try {
    const [ivHex, tagHex, dataHex] = cipherText.split(":");

    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(tagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", INVENTORY_SECRET_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(dataHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return "";
  }
};
