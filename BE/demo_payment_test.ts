/**
 * DEMO: UNIT TESTING vs COVERITY (STATIC ANALYSIS)
 * Flow: VNPay Payment Verification
 */

class MockVNPayService {
    verifyIpn(params: any, secretKey: string): boolean {
        if (!params.vnp_SecureHash) return false;
        return params.vnp_SecureHash === "VALID_HASH";
    }
}

class MockPaymentService {
    async handleCallback(params: any): Promise<string> {
        console.log("\x1b[36m--- BẮT ĐẦU XỬ LÝ CALLBACK ---\x1b[0m");
        const payment = this.findPaymentInDB(params.vnp_TxnRef);

        // LỖI (Coverity sẽ bắt được): payment có thể là null
        console.log(`Checking status for payment: ${payment.status}`);

        const amount = parseInt(params.vnp_Amount) / 100;
        if (amount !== payment.amount) {
            return "\x1b[31mFAILED: Amount mismatch\x1b[0m";
        }

        return "\x1b[32mSUCCESS: Wallet topped up\x1b[0m";
    }

    findPaymentInDB(ref: string) {
        if (ref === "MISSING") return null;
        return { amount: 10000, status: "Pending" };
    }
}

async function runDemo() {
    const service = new MockPaymentService();

    console.log("\x1b[1mSCENARIO 1: Giao dịch hợp lệ\x1b[0m");
    try {
        const result = await service.handleCallback({ vnp_TxnRef: "REF123", vnp_Amount: "1000000" });
        console.log("Kết quả:", result);
    } catch (e: any) {
        console.error("Lỗi:", e.message);
    }

    console.log("\n\x1b[1mSCENARIO 2: Giao dịch không tồn tại (Gây lỗi NPE)\x1b[0m");
    try {
        // Unit test này sẽ fail và làm crash ứng dụng nếu không có try-catch
        const result = await service.handleCallback({ vnp_TxnRef: "MISSING", vnp_Amount: "1000000" });
        console.log("Kết quả:", result);
    } catch (e: any) {
        console.log("\x1b[31m❌ UNIT TEST PHÁT HIỆN BUG (RUNTIME ERROR):\x1b[0m", e.message);
        console.log("\x1b[33m💡 GIẢI THÍCH:\x1b[0m Unit Test chỉ thấy lỗi này KHI CHẠY với data đặc biệt.");
        console.log("\x1b[33m💡 COVERITY:\x1b[0m Sẽ thấy lỗi này NGAY LẬP TỨC khi đọc code, không cần chạy.");
    }
}

runDemo();

