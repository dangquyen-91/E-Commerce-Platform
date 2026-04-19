/**
 * COVERITY DEMO FILE — Inventory Management Defects
 *
 * File này chứa các đoạn code mô phỏng defect thực tế trong hệ thống
 * để Coverity phát hiện trong quá trình demo.
 *
 * KHÔNG dùng trong production.
 */

import crypto from "node:crypto";

// ============================================================
// DEFECT #1 — TAINTED_DATA (CWE-20)
// Coverity checker: TAINTED_DATA
// ============================================================

/**
 * Inventory query với input chưa được validate.
 * Coverity sẽ trace: req.query → Number() → .limit() và flag TAINTED_DATA
 */
function getInventoryUnsafe(req: any, res: any) {
  const limit = req.query.limit;   // TAINTED: from HTTP request
  const skip  = req.query.skip;    // TAINTED: from HTTP request

  // BAD: Number("abc") = NaN, Number("-99999") = -99999
  // Coverity flags: tainted value flows into database query parameter
  const dbLimit = Number(limit);   // ← DEFECT: no range check
  const dbSkip  = Number(skip);    // ← DEFECT: no range check

  // Simulated DB call
  console.log(`Query: limit=${dbLimit}, skip=${dbSkip}`);
}

// ============================================================
// DEFECT #2 — TAINTED_DATA / Uncontrolled Resource Consumption (CWE-400)
// Coverity checker: TAINTED_DATA
// ============================================================

const SECRET_KEY = crypto.createHash("sha256").update("demo_key").digest().subarray(0, 32);

/**
 * Encrypt secret without length validation.
 * Coverity sẽ flag: secretValue từ user input đến crypto operation không qua size check.
 */
function addInventoryItemUnsafe(req: any) {
  const secretValue = req.body.secretValue; // TAINTED: from HTTP request

  // BAD: không kiểm tra độ dài → attacker gửi string 10MB → AES encrypt hết
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", SECRET_KEY, iv);
  let encrypted = cipher.update(secretValue, "utf8", "hex"); // ← DEFECT: unvalidated size
  encrypted += cipher.final("hex");

  return encrypted;
}

// ============================================================
// DEFECT #3 — SWALLOWED_EXCEPTION (CWE-390)
// Coverity checker: SWALLOWED_EXCEPTION / CHECKED_RETURN
// ============================================================

async function addBulkInventoryUnsafe(items: Array<{ secretValue: string }>) {
  let added = 0;
  const errors: string[] = [];

  for (let i = 0; i < items.length; i++) {
    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv("aes-256-gcm", SECRET_KEY, iv);
      cipher.update(items[i].secretValue, "utf8", "hex");
      cipher.final("hex");
      added++;
    } catch (error: any) {
      // BAD: chỉ lưu message, toàn bộ stack trace và loại lỗi bị mất
      // Coverity flags: exception caught but details discarded
      errors.push(`Item ${i + 1}: ${error.message}`); // ← DEFECT: SWALLOWED_EXCEPTION
    }
  }

  return { added, errors };
}

// ============================================================
// DEFECT #4 — TOCTOU / Race Condition (CWE-362)
// Coverity checker: TOCTOU
// ============================================================

// Simulated in-memory inventory (thay cho MongoDB)
const inventoryDB: Map<string, { status: string; secretValue: string }> = new Map();

async function updateInventoryItemUnsafe(itemId: string, newSecret: string) {
  // CHECK at time T1
  const item = inventoryDB.get(itemId);
  if (!item) throw new Error("Item không tồn tại");

  // DEFECT: khoảng thời gian giữa CHECK và USE
  // Coverity flags: value read at check-time may differ at use-time
  if (item.status !== "Available") { // ← CHECK (T1)
    throw new Error("Item không Available");
  }

  // Simulate async delay (order processing by another request happens here)
  await new Promise(resolve => setTimeout(resolve, 10));

  // USE at time T2 — item.status có thể đã thay đổi bởi request khác
  item.secretValue = newSecret; // ← USE (T2): TOCTOU DEFECT
  inventoryDB.set(itemId, item);
}

// ============================================================
// DEFECT #5 — MISSING_CHECK / NULL_DEREFERENCE (CWE-476)
// Coverity checker: MISSING_CHECK
// ============================================================

function maskEmailUnsafe(secret: string, type: string): string {
  if (type === "Account") {
    const [local, domain] = secret.split("@");
    // BAD: nếu secret = "@example.com" thì local = "" (falsy) nhưng
    // nếu có nhánh khác truyền empty string, local[0] = undefined
    if (local && domain) {
      return `${local[0]}***@${domain}`; // ← DEFECT: local có thể "", local[0] undefined
    }
  }
  return "***";
}

// ============================================================
// DEFECT #6 — DEAD_CODE / Silent Empty Return (CWE-252)
// Coverity checker: DEAD_CODE / NULL_RETURNS
// ============================================================

async function getInventorySilentFail(userId: string) {
  // Simulate shop lookup
  const shop = null; // shop không tồn tại

  if (!shop) {
    // BAD: trả về empty thay vì throw error
    // Caller nhận HTTP 200 với data rỗng, không biết tại sao
    // Coverity flags: possible null return not communicated to caller
    return { items: [], total: 0 }; // ← DEFECT: silent failure
  }

  return { items: ["item1"], total: 1 };
}

export {
  getInventoryUnsafe,
  addInventoryItemUnsafe,
  addBulkInventoryUnsafe,
  updateInventoryItemUnsafe,
  maskEmailUnsafe,
  getInventorySilentFail,
};
