import crypto from "crypto";
import querystring from "qs";
import { env } from "@/config/env";

export interface VNPayConfig {
  tmnCode: string;
  secretKey: string;
  vnpUrl: string;
  returnUrl: string;
  ipnUrl: string;
}

export interface VNPayPaymentParams {
  amount: number; // VND
  orderId: string; // Transaction reference
  orderInfo: string; // Order description
  orderType?: string;
  locale?: string;
  returnUrl?: string;
  ipnUrl?: string;
}

export interface VNPayCallbackParams {
  vnp_Amount: string;
  vnp_BankCode?: string;
  vnp_BankTranNo?: string;
  vnp_CardType?: string;
  vnp_OrderInfo: string;
  vnp_PayDate: string;
  vnp_ResponseCode: string;
  vnp_TmnCode: string;
  vnp_TransactionNo: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_SecureHashType?: string;
  vnp_SecureHash: string;
}

class VNPayService {
  private config: VNPayConfig;

  constructor() {
    this.config = {
      tmnCode: process.env.VNPAY_TMN_CODE || env.vnpayTmnCode || "FEO4I1LY",
      secretKey: process.env.VNPAY_SECRET_KEY || env.vnpaySecretKey || "OFB6MUKNV0DJQQO0J53GVSIDUSMY25IF",
      vnpUrl: process.env.VNPAY_URL || env.vnpayUrl || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
      // IMPORTANT: Always use backend return URL so backend can process payment before redirecting to frontend
      returnUrl: process.env.VNPAY_RETURN_URL || env.vnpayReturnUrl || `${env.backendUrl}/api/payments/vnpay/return`,
      ipnUrl: process.env.VNPAY_IPN_URL || env.vnpayIpnUrl || `${env.backendUrl}/api/payments/vnpay/ipn`,
    };
    
  }

  /**
   * Create payment URL for VNPay
   */
  createPaymentUrl(params: VNPayPaymentParams): string {
    const {
      amount,
      orderId,
      orderInfo,
      orderType = "other",
      locale = "vn",
      returnUrl,
    } = params;

    // VNPay expects time in GMT+7. Serverless (e.g. Vercel) runs UTC, so adjust to VN timezone.
    const nowVN = this.toVNTime();
    const createDate = this.formatDate(nowVN);
    const expireDate = this.formatDate(new Date(nowVN.getTime() + 15 * 60 * 1000)); // +15 minutes

    const vnp_Params: Record<string, string> = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: this.config.tmnCode,
      vnp_Amount: String(amount * 100), // Convert to smallest unit
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: orderType,
      vnp_Locale: locale,
      vnp_ReturnUrl: returnUrl || this.config.returnUrl,
      vnp_IpAddr: "127.0.0.1",
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // Sort params alphabetically and remove empty values
    const sortedParams = this.sortObject(vnp_Params);
    
    // Create query string for hash calculation using querystring library
    // This matches VNPay's demo code exactly
    const signData = querystring.stringify(sortedParams, { encode: false });
    
    // Create secure hash from query string
    const secureHash = this.createSecureHash(signData);
    
    // Add SecureHash to params
    sortedParams['vnp_SecureHash'] = secureHash;
    
    // Build final URL using querystring.stringify with encode: false
    // This matches VNPay's demo code exactly
    const finalQueryString = querystring.stringify(sortedParams, { encode: false });
    
    return `${this.config.vnpUrl}?${finalQueryString}`;
  }


  /**
   * Verify IPN callback from VNPay
   */
  verifyIpn(params: VNPayCallbackParams): boolean {
    const {
      vnp_SecureHash,
      ...otherParams
    } = params;

    // Remove secure hash from params
    const cleanParams: Record<string, any> = { ...otherParams };
    // VNPay demo removes vnp_SecureHashType as well
    delete cleanParams.vnp_SecureHashType;
    
    // Sort params
    const sortedParams = this.sortObject(cleanParams);
    
    // Create query string using querystring library (same as createPaymentUrl)
    const signData = querystring.stringify(sortedParams, { encode: false });
    
    // Create secure hash
    const secureHash = this.createSecureHash(signData);

    // Compare with provided hash
    return secureHash === vnp_SecureHash;
  }

  /**
   * Create secure hash for VNPay
   * Uses HMAC SHA512 algorithm
   */
  private createSecureHash(queryString: string): string {
    // Ensure secret key is correct
    if (!this.config.secretKey || this.config.secretKey.length === 0) {
      throw new Error("VNPay secret key is not configured");
    }
    
    // Create HMAC SHA512 hash
    const hmac = crypto.createHmac("sha512", this.config.secretKey);
    const hash = hmac.update(queryString, "utf-8").digest("hex");

    return hash;
  }

  /**
   * Sort object by keys alphabetically
   * Encode keys and values like VNPay demo code
   * This matches the exact implementation from VNPay's demo
   */
  private sortObject(obj: Record<string, string>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const str: string[] = [];
    
    // Collect and encode all keys
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        // Only include non-empty values
        if (value !== null && value !== undefined && value !== "") {
          str.push(encodeURIComponent(key));
        }
      }
    }
    
    // Sort encoded keys
    str.sort();
    
    // Build sorted object with encoded keys and values
    for (let i = 0; i < str.length; i++) {
      const encodedKey = str[i];
      // Decode key to get original key
      const originalKey = decodeURIComponent(encodedKey);
      const value = obj[originalKey];
      // Encode value and replace %20 with +
      sorted[encodedKey] = encodeURIComponent(String(value)).replace(/%20/g, "+");
    }
    
    return sorted;
  }

  /**
   * Format date to VNPay format (yyyyMMddHHmmss)
   */
  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  /**
   * Convert current server time to Vietnam time (GMT+7).
   * Serverless (Vercel) runs UTC; this prevents immediate timeout on VNPay.
   */
  private toVNTime(date: Date = new Date()): Date {
    const targetOffsetMinutes = 7 * 60; // GMT+7
    const localOffsetMinutes = -date.getTimezoneOffset(); // local offset in minutes
    const diffMinutes = targetOffsetMinutes - localOffsetMinutes;
    return new Date(date.getTime() + diffMinutes * 60 * 1000);
  }

  /**
   * Get response message from VNPay response code
   */
  getResponseMessage(responseCode: string): string {
    const messages: Record<string, string> = {
      "00": "Giao dịch thành công",
      "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
      "09": "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking",
      "10": "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
      "11": "Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.",
      "12": "Thẻ/Tài khoản bị khóa.",
      "13": "Nhập sai mật khẩu xác thực giao dịch (OTP). Xin vui lòng thực hiện lại giao dịch.",
      "51": "Tài khoản không đủ số dư để thực hiện giao dịch.",
      "65": "Tài khoản đã vượt quá hạn mức giao dịch trong ngày.",
      "75": "Ngân hàng thanh toán đang bảo trì.",
      "79": "Nhập sai mật khẩu đăng nhập InternetBanking quá số lần quy định.",
      "99": "Lỗi không xác định.",
    };

    return messages[responseCode] || `Lỗi không xác định (Mã: ${responseCode})`;
  }

  /**
   * Check if response code indicates success
   */
  isSuccessResponse(responseCode: string): boolean {
    return responseCode === "00";
  }
}

export const vnpayService = new VNPayService();
