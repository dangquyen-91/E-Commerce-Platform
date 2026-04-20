# Script Thuyết Trình — Coverity Static Analysis
## Luồng Quản Lý Kho | E-Commerce Platform

> **Thời lượng:** ~15–20 phút  
> **Cấu trúc:** Mở đầu → Giới thiệu hệ thống → Demo Coverity (file C) → Phân tích Defect → Liên hệ TypeScript → Kết luận

---

## PHẦN 0 — DEMO LIVE VỚI FILE C (3–5 phút)

> *(Mở terminal, chạy trước khi bắt đầu thuyết trình hoặc live trong lúc demo)*

---

**Các lệnh chạy live:**

```powershell
# Bước 1 — cd vào Coverity
cd D:\cov-analysis-win64-2024.12.1\cov-analysis-win64-2024.12.1

# Bước 2 — Capture file C có defect
.\bin\cov-build.exe --dir C:\cov-int-c "D:\winlibs-x86_64-posix-seh-gcc-15.2.0-mingw-w64ucrt-14.0.0-r7\mingw64\bin\gcc.exe" "D:\SWD\E-Commerce-Platform\coverity\demo.c"

# Bước 3 — Tạo file nén
cd C:\
tar czvf D:\E-Commerce-Platform-c.tgz cov-int-c
```

Sau đó upload `D:\E-Commerce-Platform-c.tgz` lên **scan.coverity.com** → Submit Build.

**Script nói khi chạy:**

"Em đang chạy Coverity Build Capture — tool này intercept quá trình biên dịch GCC và thu thập thông tin về từng dòng code, từng biến, từng luồng dữ liệu. Kết quả là một thư mục `cov-int` chứa intermediate representation của toàn bộ code."

"Bước tiếp theo là upload lên Coverity Scan cloud để server phân tích — server sẽ chạy hơn 1000 checker khác nhau trên code này."

---

---

## PHẦN 1 — MỞ ĐẦU (1–2 phút)

> *(Nhìn vào giám khảo/lớp, không nhìn màn hình)*

---

"Xin chào thầy/cô và các bạn.

Hôm nay nhóm em sẽ demo **kiểm thử tĩnh** — hay còn gọi là Static Analysis — trên module **Quản lý Kho hàng** của hệ thống E-Commerce mà nhóm em đang phát triển.

Công cụ em sử dụng là **Coverity** của Synopsys — đây là một trong những công cụ phân tích tĩnh phổ biến nhất trong ngành, được dùng tại các công ty như NASA, Boeing, và nhiều tập đoàn công nghệ lớn.

Điểm khác biệt của Static Analysis so với Unit Test hay Integration Test là: **không cần chạy code**. Coverity đọc trực tiếp source code, xây dựng đồ thị luồng dữ liệu, và tìm ra các lỗi tiềm ẩn mà test thông thường khó phát hiện — đặc biệt là **race condition** và **lỗi bảo mật**."

---

## PHẦN 2 — GIỚI THIỆU HỆ THỐNG (2–3 phút)

> *(Mở file `inventory.service.ts` trên IDE)*

---

"Trước khi vào demo, em xin giới thiệu nhanh về module đang phân tích.

Đây là hệ thống bán **hàng hóa kỹ thuật số** — tức là seller không bán hàng vật lý mà bán:
- Tài khoản game, tài khoản phần mềm
- Mã kích hoạt (license key, gift card)
- Link mời, QR code

Mỗi item trong kho gọi là `InventoryItem`, chứa một trường quan trọng là `secretValue` — đây là **thông tin nhạy cảm thực sự** như mật khẩu tài khoản hay mã kích hoạt của người dùng.

Hệ thống có 5 chức năng chính:
1. Seller **thêm item** vào kho (đơn lẻ hoặc bulk)
2. Seller **xem** danh sách kho của mình
3. Seller **cập nhật** item
4. Seller **xóa** item
5. Hệ thống **tự động giao** item khi buyer đặt hàng

Luồng trạng thái của item là: `Available → Reserved → Delivered`

Vì dữ liệu nhạy cảm, `secretValue` được **mã hóa AES-256-GCM** trước khi lưu vào database."

---

## PHẦN 3 — GIỚI THIỆU COVERITY (2 phút)

> *(Mở terminal hoặc slide giải thích quy trình)*

---

"Coverity hoạt động theo 3 bước chính:

**Bước 1 — Build Capture:**  
Coverity 'nghe' quá trình build, thu thập toàn bộ source file cần phân tích.  
Với JavaScript/TypeScript thì dùng `--fs-capture-search` để quét thư mục.

**Bước 2 — Analyze:**  
Coverity xây dựng **Control Flow Graph** và **Data Flow Graph** cho toàn bộ code.  
Từ đó tìm ra các pattern nguy hiểm theo hơn 1000 checker khác nhau.

**Bước 3 — Report:**  
Xuất HTML report, liệt kê từng defect kèm **data flow path** — tức là Coverity chỉ đúng dòng nào là nguồn gốc lỗi, dữ liệu đi qua đâu, và dòng nào gây ra vấn đề.

Bây giờ em sẽ chạy thực tế."

---

## PHẦN 4 — CHẠY COVERITY LIVE (2–3 phút)

> *(Mở terminal, cd vào thư mục coverity)*

---

"Em chạy script phân tích:"

```cmd
cd coverity
run-analysis.bat
```

> *(Trong khi chờ chạy, giải thích từng bước hiện trên terminal)*

"Đây là **Step 1** — Coverity cấu hình analyzer cho JavaScript/TypeScript.

**Step 2** — Capture source files. Coverity đang đọc toàn bộ các file trong module inventory và utils.

**Step 3** — Đây là bước quan trọng nhất. `cov-analyze` đang chạy các checker: TAINTED_DATA, TOCTOU, SWALLOWED_EXCEPTION...

**Step 4** — Xuất HTML report.

Và đây — phân tích hoàn tất. Em mở report."

> *(Mở file `cov-output/inventory-defects-report/index.html`)*

"Coverity tìm được **6 defects** trong module này. Em sẽ phân tích 3 defect quan trọng nhất."

---

## PHẦN 5 — PHÂN TÍCH DEFECT (8–10 phút)

---

### Defect #1 — TOCTOU (Race Condition) ⭐ Quan trọng nhất

> *(Click vào defect TOCTOU trong report, highlight dòng 239–258 trong `inventory.service.ts`)*

---

"Defect đầu tiên và nguy hiểm nhất là **TOCTOU** — viết tắt của *Time of Check to Time of Use*.

Đây là lỗi **race condition** xảy ra trong hàm `updateInventoryItem`.

Nhìn vào đây:"

```typescript
// Dòng 239: CHECK — đọc item từ DB
const item = await InventoryItem.findOne({ _id: itemId });

// Dòng 249: CHECK — kiểm tra status
if (item.status !== "Available") throw new Error(...);

// ... khoảng thời gian async ...

// Dòng 255: USE — lưu thay đổi
await item.save();
```

"Vấn đề ở đây là: giữa lần đọc `status` ở dòng 249 và lần `save()` ở dòng 255, có một khoảng thời gian async.

Hãy hình dung tình huống này:

- **Request A** của Seller đọc item → status = `Available` → CHECK pass
- **Request B** của Buyer đặt hàng → item chuyển sang `Reserved`
- **Request A** tiếp tục → ghi đè lên item đang `Reserved` → **data inconsistency!**

Hậu quả thực tế: item đã được một buyer đặt hàng nhưng seller vẫn cập nhật được, gây ra tình trạng **một item giao cho hai người**.

**Fix của Coverity gợi ý** là dùng atomic operation:

```typescript
// Thay vì findOne rồi save riêng lẻ:
const item = await InventoryItem.findOneAndUpdate(
  { _id: itemId, status: 'Available' },  // điều kiện atomic
  { $set: { secretValue: encryptedSecret } },
  { new: true }
);
```

Khi đó check và update xảy ra trong **một lần DB call duy nhất**, không có race condition."

---

### Defect #2 — TAINTED_DATA (Input Validation)

> *(Click defect TAINTED_DATA #1 trong report, highlight dòng 29–30 trong `inventory.controller.ts`)*

---

"Defect thứ hai là **TAINTED_DATA** — dữ liệu từ user input chưa được kiểm tra trước khi dùng.

Đây là đoạn code trong Controller:

```typescript
// req.query.limit đến thẳng từ URL: /api/inventory?limit=abc
limit: limit ? Number(limit) : 50,
skip:  skip  ? Number(skip)  : 0,
```

Coverity trace luồng này như sau:"

```
req.query.limit  ← TAINTED SOURCE (HTTP input)
    │
    ▼
Number(limit)    ← không validate, Number("abc") = NaN
    │
    ▼
.limit(NaN)      ← TAINTED SINK (database query)
```

"Khi `limit = NaN` truyền vào Mongoose `.limit(NaN)`, behavior không xác định — có thể trả về toàn bộ collection, crash, hoặc memory spike.

Ngoài ra với `secretValue` ở defect #2, user có thể gửi string dài hàng MB để exploit CPU khi hệ thống mã hóa AES — đây là dạng tấn công **DoS** nhắm vào crypto operation.

**Fix:**
```typescript
limit: Math.min(Math.max(Number(limit) || 50, 1), 200),
skip:  Math.max(Number(skip) || 0, 0),
```"

---

### Defect #3 — SWALLOWED_EXCEPTION

> *(Click defect SWALLOWED_EXCEPTION, highlight dòng 122–124 trong `inventory.service.ts`)*

---

"Defect thứ ba là **SWALLOWED_EXCEPTION** — bắt exception nhưng nuốt mất thông tin.

```typescript
try {
  await InventoryItem.create({ secretValue: encryptedSecret, ... });
  added++;
} catch (error: any) {
  errors.push(`Item ${i + 1}: ${error.message}`);  // ← chỉ lưu message
}
```

Vấn đề:
- `error.message` có thể là `undefined` với một số loại error
- Toàn bộ stack trace bị mất → **không thể debug production**
- Nếu `encryptSecret()` throw lỗi do key config sai, lỗi bị ignore và code tiếp tục chạy với data corrupt

Coverity gọi đây là *error swallowing* — pattern nguy hiểm vì tạo ra **false sense of success**: hàm trả về `{ added: 5, errors: [] }` nhưng thực ra 5 item đó có secretValue rỗng."

---

## PHẦN 6 — TỔNG KẾT DEFECTS (1 phút)

> *(Quay lại trang overview của Coverity report)*

---

"Tổng cộng Coverity phát hiện **6 defects** trong module Inventory:

| Severity | Số lượng |
|----------|----------|
| HIGH     | 3 (TOCTOU, 2x TAINTED_DATA) |
| MEDIUM   | 3 (SWALLOWED_EXCEPTION, MISSING_CHECK, NULL_RETURNS) |

Điều đáng chú ý là **không có defect nào được Unit Test phát hiện** — vì TOCTOU cần 2 request đồng thời, TAINTED_DATA cần input bất thường, và SWALLOWED_EXCEPTION xảy ra trong error path hiếm gặp khi test."

---

## PHẦN 7 — KẾT LUẬN (1–2 phút)

---

"Qua demo này, em rút ra 3 điểm chính:

**Thứ nhất**, Static Analysis như Coverity bổ sung cho testing truyền thống, không thay thế. Coverity tìm được lỗi *về mặt cấu trúc code* mà test case khó reproduce.

**Thứ hai**, trong hệ thống xử lý dữ liệu nhạy cảm như mã hóa tài khoản, các defect dạng TAINTED_DATA và TOCTOU có thể dẫn đến **vi phạm bảo mật nghiêm trọng và mất tiền của user** — không chỉ là bug thông thường.

**Thứ ba**, Coverity tích hợp được vào CI/CD pipeline. Mỗi lần push code, Coverity scan tự động và chặn merge nếu có defect HIGH severity — đây là cách các công ty lớn enforce code quality.

Cảm ơn thầy/cô và các bạn đã lắng nghe. Nhóm em xin nhận câu hỏi."

---

## PHỤ LỤC — Câu hỏi thường gặp

**Q: Coverity khác ESLint như thế nào?**  
"ESLint kiểm tra syntax và style. Coverity phân tích data flow qua nhiều hàm và file — ví dụ trace một giá trị từ `req.query` đi qua 3 hàm rồi đến DB query. ESLint không làm được điều này."

**Q: Sao không dùng SonarQube thay Coverity?**  
"SonarQube cũng là SAST tool tốt và miễn phí. Coverity mạnh hơn ở inter-procedural analysis — tức là phân tích xuyên qua nhiều function call. Với module inventory, TOCTOU phải trace qua `controller → service → model` mới phát hiện được, đây là điểm mạnh của Coverity."

**Q: Coverity có false positive không?**  
"Có, khoảng 15–20%. Trong report, mỗi defect có trạng thái Triage: Unreviewed, Intentional, False Positive. Quy trình thực tế là developer review từng defect và dismiss các false positive có lý do."

**Q: Chi phí Coverity thế nào?**  
"Coverity có bản miễn phí cho open source tại scan.coverity.com. Bản thương mại tính theo số dòng code, thường dành cho enterprise. GitHub cũng tích hợp CodeQL miễn phí với chức năng tương tự."
