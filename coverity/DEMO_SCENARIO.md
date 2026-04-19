# Kịch bản Demo Coverity — Luồng Quản Lý Kho (Inventory Management)

> **Môn:** Software Testing  
> **Công cụ:** Coverity Static Analysis (Synopsys)  
> **Module phân tích:** Inventory Management — E-Commerce Platform

---

## 1. Tổng quan hệ thống

Hệ thống bán hàng kỹ thuật số (digital goods) cho phép seller quản lý kho hàng gồm:
- Tài khoản game/phần mềm (`Account`)
- Link mời (`InviteLink`)
- Mã kích hoạt (`Code`)
- QR Code (`QR`)

Mỗi item trong kho có **secretValue** (thông tin nhạy cảm) được mã hóa AES-256-GCM trước khi lưu xuống DB.

### Các file phân tích chính

| File | Vai trò |
|------|---------|
| `services/inventory/inventory.service.ts` | Business logic chính |
| `controllers/inventory/inventory.controller.ts` | HTTP handler |
| `utils/helpers.ts` | Mã hóa/giải mã secretValue |
| `models/products/inventory-item.model.ts` | Schema DB |

---

## 2. Các bước chạy Coverity

### Yêu cầu
- Coverity Static Analysis đã cài đặt, PATH đã set
- Node.js ≥ 18, yarn hoặc npm

### Chạy phân tích (Windows)

```cmd
cd E-Commerce-Platform\coverity
run-analysis.bat
```

### Chạy phân tích (Linux/Mac)

```bash
cd E-Commerce-Platform/coverity
chmod +x run-analysis.sh
./run-analysis.sh
```

### Xem kết quả

Mở file: `coverity/cov-output/inventory-defects-report/index.html`

---

## 3. Các Defect Coverity Phát Hiện

### DEFECT #1 — TAINTED_DATA (Severity: HIGH)

**File:** `controllers/inventory/inventory.controller.ts` dòng 29–30  
**CWE:** CWE-20 (Improper Input Validation)

```typescript
// inventory.controller.ts:29-30
limit: limit ? Number(limit) : 50,
skip:  skip  ? Number(skip)  : 0,
```

**Vấn đề:**  
`limit` và `skip` lấy trực tiếp từ `req.query` (user input) rồi ép kiểu bằng `Number()`.  
`Number("abc")` → `NaN`, `Number("-1")` → `-1`.  
`NaN` và số âm truyền vào `.limit(NaN)` / `.skip(-1)` của Mongoose gây lỗi truy vấn không kiểm soát.

**Luồng dữ liệu (data flow):**
```
req.query.limit (user input)
  → Number(limit)          ← không validate
  → inventoryService.getMyInventory({ limit: NaN })
  → InventoryItem.find().limit(NaN)  ← hành vi không xác định
```

**Fix:**
```typescript
limit: Math.min(Math.max(Number(limit) || 50, 1), 200),
skip:  Math.max(Number(skip)  || 0,  0),
```

---

### DEFECT #2 — TAINTED_DATA / MISSING_CHECK (Severity: HIGH)

**File:** `controllers/inventory/inventory.controller.ts` dòng 80–84  
**CWE:** CWE-20, CWE-400 (Uncontrolled Resource Consumption)

```typescript
// inventory.controller.ts:80-84
const { productId, secretType, secretValue } = req.body;
if (!productId || !secretType || !secretValue) {
  throw new AppError("Vui lòng cung cấp đầy đủ thông tin", 400);
}
```

**Vấn đề:**  
`secretValue` không kiểm tra độ dài. Attacker gửi `secretValue` dài hàng MB → truyền vào `encryptSecret()` → tốn CPU mã hóa, gây DoS.

**Luồng dữ liệu:**
```
req.body.secretValue (user input, không giới hạn kích thước)
  → addInventoryItem({ secretValue })
  → encryptSecret(secretValue)        ← AES encrypt toàn bộ string
  → InventoryItem.create(...)         ← lưu vào DB không giới hạn
```

**Fix:**
```typescript
if (secretValue.length > 2000) {
  throw new AppError("secretValue không được vượt quá 2000 ký tự", 400);
}
```

---

### DEFECT #3 — SWALLOWED_EXCEPTION (Severity: MEDIUM)

**File:** `services/inventory/inventory.service.ts` dòng 106–125  
**CWE:** CWE-390 (Detection of Error Condition Without Action)

```typescript
// inventory.service.ts:106-125
for (let i = 0; i < items.length; i++) {
  const item = items[i];
  try {
    const encryptedSecret = encryptSecret(item.secretValue);
    await InventoryItem.create({ ... });
    added++;
  } catch (error: any) {
    errors.push(`Item ${i + 1}: ${error.message}`);  // ← chỉ lưu message
  }
}
```

**Vấn đề:**  
- `error.message` có thể là `undefined` nếu là lỗi kiểu `string throw`
- Toàn bộ stack trace bị nuốt → không thể debug production
- Nếu `encryptSecret` throw do lỗi crypto (key lỗi), error bị ignore → data corrupt

**Fix:**
```typescript
} catch (error: any) {
  const msg = error instanceof Error ? error.message : String(error);
  errors.push(`Item ${i + 1}: ${msg}`);
  // Log đầy đủ để monitor
  console.error(`[BulkInventory] item ${i + 1} failed:`, error);
}
```

---

### DEFECT #4 — TOCTOU (Time-of-Check to Time-of-Use) (Severity: HIGH)

**File:** `services/inventory/inventory.service.ts` dòng 239–258  
**CWE:** CWE-362 (Race Condition)

```typescript
// inventory.service.ts:239-258
async updateInventoryItem(...) {
  // CHECK: đọc item và kiểm tra status
  const item = await InventoryItem.findOne({ _id: itemId, ... });
  if (!item) throw ...;
  if (item.status !== "Available") throw ...;  // ← CHECK tại thời điểm T1

  // ... (khoảng thời gian T1 → T2)

  item.secretType = ...;
  item.secretValue = ...;
  await item.save();  // ← USE tại thời điểm T2
}
```

**Vấn đề:**  
Nếu 2 request đồng thời cùng gọi `updateInventoryItem` / `deleteInventoryItem` cho cùng 1 item:

```
Request A:  findOne (status=Available) → CHECK OK → ...chờ...
Request B:  findOne (status=Available) → CHECK OK → save (Reserved)
Request A:  ...→ save (ghi đè trạng thái Reserved về Available data mới)
```

Item đã được `Reserved` (buyer đã đặt hàng) bị update lại → **data inconsistency nghiêm trọng**.

**Fix:**
```typescript
// Dùng findOneAndUpdate với điều kiện atomic
const item = await InventoryItem.findOneAndUpdate(
  { _id: itemId, shopId: shop._id, isDeleted: false, status: "Available" },
  { $set: { secretType: updates.secretType, secretValue: encryptedSecret } },
  { new: true }
);
if (!item) throw new AppError("Item không tồn tại hoặc không thể cập nhật", 400);
```

---

### DEFECT #5 — MISSING_CHECK / STRING_NULL (Severity: MEDIUM)

**File:** `utils/helpers.ts` dòng 27–28  
**CWE:** CWE-476 (NULL Pointer Dereference)

```typescript
// helpers.ts:27-28
const [local, domain] = secret.split("@");
if (local && domain) {
  return `${local[0]}***@${domain}`;  // ← local[0] có thể undefined nếu local = ""
}
```

**Vấn đề:**  
Nếu `secret = "@example.com"` → `local = ""` → `local` truthy là `""` → falsy → bỏ qua.  
Nhưng nếu `secret = "a@"` → `domain = ""` → falsy → bỏ qua, return `"***"` thay vì mask đúng.  
Nếu `local = ""` và có bug khác truyền vào → `local[0]` = `undefined`.

**Fix:**
```typescript
const atIndex = secret.indexOf("@");
if (atIndex > 0 && atIndex < secret.length - 1) {
  const local  = secret.substring(0, atIndex);
  const domain = secret.substring(atIndex + 1);
  return `${local[0]}***@${domain}`;
}
```

---

### DEFECT #6 — NULL_RETURNS / DEAD_CODE (Severity: MEDIUM)

**File:** `services/inventory/inventory.service.ts` dòng 137–140  
**CWE:** CWE-252 (Unchecked Return Value)

```typescript
// inventory.service.ts:137-140
async getMyInventory(userId: string, filter: InventoryFilter = {}) {
  const shop = await this.getShopByOwner(userId);
  if (!shop) {
    return { items: [], total: 0 };  // ← silent empty, không phân biệt "chưa có shop" vs "shop bị xóa"
  }
```

**Vấn đề:**  
Controller nhận `{ items: [], total: 0 }` và trả về HTTP 200 → client không biết lý do.  
Trong khi đó `addInventoryItem` cùng logic lại throw `AppError 403`.  
**Inconsistent error handling** trong cùng 1 module.

---

## 4. Tổng hợp Defects

| # | Defect | File | Dòng | Severity | CWE |
|---|--------|------|------|----------|-----|
| 1 | TAINTED_DATA | inventory.controller.ts | 29–30 | HIGH | CWE-20 |
| 2 | TAINTED_DATA | inventory.controller.ts | 80–84 | HIGH | CWE-400 |
| 3 | SWALLOWED_EXCEPTION | inventory.service.ts | 122–124 | MEDIUM | CWE-390 |
| 4 | TOCTOU | inventory.service.ts | 249–258 | HIGH | CWE-362 |
| 5 | MISSING_CHECK | helpers.ts | 27–28 | MEDIUM | CWE-476 |
| 6 | NULL_RETURNS | inventory.service.ts | 138–140 | MEDIUM | CWE-252 |

---

## 5. Kịch bản Demo (Thứ tự thuyết trình)

### Scene 1 — Giới thiệu module (2 phút)
- Mở `inventory.service.ts`, giải thích luồng: Seller thêm kho → item được mã hóa → buyer đặt hàng → item giao
- Nhấn mạnh dữ liệu nhạy cảm: `secretValue` là account game/mã kích hoạt thực

### Scene 2 — Chạy Coverity (3 phút)
```cmd
cd coverity
run-analysis.bat
```
- Show terminal output từng bước: configure → capture → analyze → report

### Scene 3 — Xem Report (5 phút)
- Mở `cov-output/inventory-defects-report/index.html`
- Lọc theo Severity: HIGH trước
- Click vào từng defect, Coverity sẽ highlight dòng code và show data flow

### Scene 4 — Phân tích từng Defect (10 phút)
Thứ tự ưu tiên demo:
1. **TOCTOU** (Defect #4) — dễ gây ấn tượng nhất, minh họa race condition với 2 user đồng thời
2. **TAINTED_DATA** (Defect #1 & #2) — phổ biến, liên quan trực tiếp security
3. **SWALLOWED_EXCEPTION** (Defect #3) — common mistake trong production code

### Scene 5 — Fix và re-scan (5 phút)
- Apply fix cho Defect #1 (thêm validate `limit`/`skip`)
- Re-run `run-analysis.bat`
- Show defect #1 đã biến mất khỏi report

---

## 6. Câu hỏi thường gặp từ giám khảo

**Q: Tại sao dùng Coverity thay vì unit test?**  
A: Coverity phát hiện lỗi *trước khi chạy code* (static analysis), bao gồm cả race condition (TOCTOU) và data flow qua nhiều hàm mà unit test khó cover hết.

**Q: TOCTOU có thực sự xảy ra trong production không?**  
A: Có. Khi buyer đặt hàng và seller cập nhật item cùng lúc, hoặc 2 buyer cùng checkout 1 item cuối cùng.

**Q: Coverity có thể thay thế code review không?**  
A: Không. Coverity tìm defect patterns đã biết, còn code review phát hiện logic sai, design issue, business rule vi phạm.
