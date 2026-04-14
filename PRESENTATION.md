# Bài Thuyết Trình: Unit Testing – Luồng Quản Lý Kho

---

## SLIDE 1 — TRANG BÌA

**Tiêu đề:** Unit Testing với Jest — Luồng Quản Lý Kho
**Hệ thống:** E-Commerce Platform (Digital Goods Marketplace)
**Môn:** Software Testing

---

## SLIDE 2 — GIỚI THIỆU HỆ THỐNG

**Nói:**
> "Trước khi vào phần test, mình sẽ giới thiệu nhanh về hệ thống để mọi người hiểu context."

**Hệ thống là gì?**

Một sàn thương mại điện tử chuyên bán **hàng số** — tài khoản Netflix, Spotify, code phần mềm, invite link, QR code. Không phải hàng vật lý, nên "kho hàng" ở đây là kho lưu trữ các **thông tin bí mật được mã hóa** (secret).

**Các vai trò:**
- **Seller** — đăng ký shop, nhập kho hàng số vào hệ thống
- **Customer** — mua hàng, hệ thống tự giao secret
- **Admin/Mod** — quản lý, duyệt

**Tại sao chọn luồng quản lý kho để test?**

> "Đây là luồng nghiệp vụ cốt lõi nhất. Kho sai đồng nghĩa với giao nhầm hàng, lộ thông tin bí mật, hoặc xóa nhầm item đang trong đơn hàng của khách — thiệt hại trực tiếp. Đây là loại logic *bắt buộc phải có test bao phủ*."

---

## SLIDE 3 — MÔ HÌNH DỮ LIỆU & VÒNG ĐỜI

**Một `InventoryItem` có các trường chính:**

| Trường | Ý nghĩa |
|---|---|
| `shopId` | Thuộc shop nào |
| `productId` | Gắn với sản phẩm nào |
| `secretType` | Loại: Account / Code / InviteLink / QR |
| `secretValue` | Giá trị bí mật — **được mã hóa AES-256-GCM** trước khi lưu |
| `status` | Trạng thái hiện tại |
| `isDeleted` | Soft delete flag |

**Vòng đời trạng thái:**

```
Seller nhập kho
      ↓
 [Available]  ←── được phép: sửa, xóa mềm
      ↓  khách đặt hàng
 [Reserved]   ←── KHÔNG được: sửa, xóa  (đang giữ cho đơn hàng)
      ↓  seller giao hàng
 [Delivered]  ←── KHÔNG được: sửa, xóa  (đã giao xong)
      ↓  thu hồi
 [Revoked]
```

> "Quy tắc nghiệp vụ quan trọng nhất: **chỉ item Available mới được sửa hoặc xóa**. Nếu vi phạm điều này, hệ thống có thể giao nhầm hoặc mất dữ liệu đơn hàng. Test phải bảo vệ rule này."

---

## SLIDE 4 — GIỚI THIỆU JEST VÀ CHIẾN LƯỢC TEST

**Jest là gì?**

> "Jest là framework test phổ biến nhất cho JavaScript/TypeScript — do Meta phát triển. Nó tích hợp sẵn test runner, assertion library, và mock system trong một package duy nhất."

**Loại test áp dụng: Unit Test**

Kiểm tra **từng method** của `InventoryService` một cách **hoàn toàn độc lập** — không phụ thuộc database, không phụ thuộc network.

**Câu hỏi thường gặp: Tại sao không test với database thật?**

> "Nếu test dùng MongoDB thật thì: phải có server DB đang chạy, phải seed data trước mỗi test, test chạy chậm (vài giây/test thay vì vài ms), và kết quả có thể không ổn định do state database. Unit test cần **nhanh** và **độc lập** — giải pháp là dùng **Mock**."

**Mock là gì và mock những gì?**

Mock là kỹ thuật **thay thế dependency thật bằng phiên bản giả** do chính test kiểm soát. Trong bài này mock 3 lớp:

```
┌─────────────────────────────────────────────────┐
│              InventoryService                    │
│   (code thật, không thay đổi)                   │
└──────────┬──────────────┬───────────────────────┘
           │              │
    ┌──────▼──────┐  ┌────▼─────────────────┐
    │  Mongoose   │  │  encryptSecret /      │
    │  Models     │  │  decryptSecret        │
    │  (MOCK ✓)   │  │  (MOCK ✓)             │
    └─────────────┘  └──────────────────────┘
```

| Thứ được mock | Lý do |
|---|---|
| `Shop.findOne`, `Product.findOne`, `InventoryItem.create/findOne/aggregate...` | Thay Mongoose bằng hàm giả — kiểm soát hoàn toàn data trả về |
| `encryptSecret` / `decryptSecret` | Dùng format giả `enc::value` để assert dễ đọc, không phụ thuộc key mã hóa thật |
| `@/config/env` | Tránh lỗi "Missing env vars" khi load module trong môi trường test |

---

## SLIDE 5 — CẤU TRÚC FILE VÀ SETUP

**Các file đã tạo:**

```
BE/
├── jest.config.js          ← cấu hình Jest: dùng ts-jest, giải quyết alias @/*
├── tsconfig.test.json      ← extends tsconfig chính, tắt strict check cho test
├── package.json            ← thêm scripts: test, test:watch, test:coverage
└── src/
    └── __tests__/
        └── inventory/
            └── inventory.service.test.ts   ← 26 test cases
```

**`jest.config.js` — giải thích:**

```js
module.exports = {
  preset: "ts-jest",          // dùng ts-jest để compile TypeScript
  testEnvironment: "node",    // chạy trong môi trường Node.js (không phải browser)
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1"  // giải quyết path alias: @/models → src/models
  },
  verbose: true,              // hiện tên từng test case khi chạy
};
```

**Pattern AAA — cấu trúc mỗi test:**

```typescript
test("mô tả test case", async () => {
  // ARRANGE – chuẩn bị mock data, điều kiện đầu vào
  (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);

  // ACT – gọi hàm cần kiểm tra
  const result = await service.addInventoryItem(USER_ID, INPUT);

  // ASSERT – kiểm tra kết quả có đúng kỳ vọng không
  expect(result.status).toBe("Available");
});
```

> "Mọi test đều theo đúng 3 bước này. Giúp test dễ đọc, dễ debug khi fail."

---

## SLIDE 6 — DEMO: SUITE 1 — `addInventoryItem`

**Nói:**
> "Suite đầu tiên kiểm tra hàm thêm một item vào kho. Có 5 test cases."

---

**TC01 — Happy path: thêm thành công**

```typescript
test("TC01 – Thêm item thành công: trả về InventoryItem với status = Available", async () => {
  // Arrange: shop tồn tại, product hợp lệ
  (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
  (Product.findOne as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
  (InventoryItem.create as jest.Mock).mockResolvedValue(createdItem);

  // Act
  const result = await service.addInventoryItem(USER_ID, VALID_INPUT);

  // Assert
  expect(result.status).toBe("Available");
  expect(InventoryItem.create).toHaveBeenCalledTimes(1);
});
```

> "Mock trả về shop và product hợp lệ. Service tạo item. Ta assert hai điều: status phải là `Available` (trạng thái khởi đầu), và `create` phải được gọi đúng 1 lần."

---

**TC02 & TC03 — Kiểm tra authorization**

```typescript
// TC02: Seller chưa có shop
(Shop.findOne as jest.Mock).mockResolvedValue(null); // DB không tìm thấy shop

await expect(
  service.addInventoryItem(USER_ID, VALID_INPUT)
).rejects.toMatchObject({ statusCode: 403 });
```

> "Query trong service lọc theo `status: 'Active'` — nghĩa là nếu shop đang Pending hay Suspended, `findOne` cũng trả `null`. Một mock `null` bao phủ cả hai trường hợp: không có shop và shop chưa được duyệt."

> "`rejects.toMatchObject({ statusCode: 403 })` — không chỉ assert là có throw, mà còn assert đúng loại lỗi: **403 Forbidden**, không phải 404 hay 500."

---

**TC05 — Kiểm tra mã hóa (quan trọng về bảo mật)**

```typescript
test("TC05 – secretValue được mã hóa trước khi lưu DB", async () => {
  await service.addInventoryItem(USER_ID, VALID_INPUT);

  // Assert 1: hàm encryptSecret được gọi với đúng plaintext
  expect(encryptSecret).toHaveBeenCalledWith(VALID_INPUT.secretValue);

  // Assert 2: giá trị lưu vào DB ≠ plaintext gốc
  const dbPayload = (InventoryItem.create as jest.Mock).mock.calls[0][0];
  expect(dbPayload.secretValue).not.toBe(VALID_INPUT.secretValue);
  expect(dbPayload.secretValue).toBe(`enc::${VALID_INPUT.secretValue}`);
});
```

> "Test này xác nhận một property bảo mật quan trọng: **database không bao giờ chứa plaintext**. `mock.calls[0][0]` truy xuất argument thật mà code đã truyền vào `InventoryItem.create` — cách Jest cho phép ta 'nghe lén' data đi vào DB."

---

## SLIDE 7 — DEMO: SUITE 2 — `addBulkInventory`

**TC06 — Bulk import thành công**

```typescript
// 3 items, tất cả thành công
const result = await service.addBulkInventory(USER_ID, PRODUCT_ID, BULK_ITEMS);

expect(result.added).toBe(3);
expect(result.errors).toHaveLength(0);
expect(InventoryItem.create).toHaveBeenCalledTimes(3); // gọi 3 lần
```

---

**TC07 — Partial failure: một số item lỗi, không dừng cả batch**

```typescript
// Mock: item 1 OK, item 2 lỗi DB, item 3 OK
(InventoryItem.create as jest.Mock)
  .mockResolvedValueOnce(makeMockItem())         // item 1: thành công
  .mockRejectedValueOnce(new Error("Duplicate")) // item 2: lỗi
  .mockResolvedValueOnce(makeMockItem());         // item 3: thành công

const result = await service.addBulkInventory(USER_ID, PRODUCT_ID, BULK_ITEMS);

expect(result.added).toBe(2);
expect(result.errors).toHaveLength(1);
expect(result.errors[0]).toMatch(/Item 2/); // lỗi ghi rõ item nào bị fail
```

> "Test này verify một design decision quan trọng: bulk import không dừng khi gặp lỗi — nó tiếp tục các item còn lại và ghi nhận lỗi. `mockResolvedValueOnce` và `mockRejectedValueOnce` cho phép mock trả về giá trị khác nhau cho từng lần gọi."

---

## SLIDE 8 — DEMO: SUITE 3 & 4 — Update và Delete

**TC10, TC11 — Không được sửa item đang Reserved/Delivered**

```typescript
// TC10: item đang Reserved
(InventoryItem.findOne as jest.Mock).mockResolvedValue(
  makeMockItem({ status: "Reserved" })
);

await expect(
  service.updateInventoryItem(USER_ID, ITEM_ID, { secretValue: "new" })
).rejects.toMatchObject({ statusCode: 400 });

// TC11: tương tự với Delivered
```

> "Đây là business rule quan trọng nhất của luồng kho. Nếu không có test này, một developer mới có thể vô tình bỏ điều kiện kiểm tra status và gây ra bug nghiêm trọng — seller sửa được item đang trong đơn hàng của khách."

---

**TC13 — Soft delete hoạt động đúng**

```typescript
const mockItem = makeMockItem({ status: "Available", isDeleted: false });
(InventoryItem.findOne as jest.Mock).mockResolvedValue(mockItem);

const result = await service.deleteInventoryItem(USER_ID, ITEM_ID);

expect(result).toBe(true);
expect(mockItem.isDeleted).toBe(true);  // flag được set
expect(mockItem.save).toHaveBeenCalledTimes(1); // document được lưu
```

> "Hệ thống dùng **soft delete** — không xóa khỏi DB mà chỉ set `isDeleted = true`. Test này verify cả 3 điều: hàm trả `true`, flag được thay đổi đúng, và `save()` thật sự được gọi."

---

## SLIDE 9 — DEMO: SUITE 5 — `getInventoryStats`

**TC16 — Tổng hợp stats chính xác**

```typescript
(InventoryItem.aggregate as jest.Mock).mockResolvedValue([
  { _id: "Available", count: 10 },
  { _id: "Reserved",  count: 3  },
  { _id: "Delivered", count: 5  },
]);

const stats = await service.getInventoryStats(USER_ID);

expect(stats.total).toBe(18);
expect(stats.available).toBe(10);
expect(stats.reserved).toBe(3);
expect(stats.delivered).toBe(5);
```

---

**TC18 — Kiểm tra pipeline aggregate có lọc đúng**

```typescript
await service.getInventoryStats(USER_ID);

// Lấy pipeline thật mà service đã truyền vào aggregate()
const pipeline = (InventoryItem.aggregate as jest.Mock).mock.calls[0][0];
const matchStage = pipeline.find((stage) => "$match" in stage);

// Pipeline PHẢI có điều kiện isDeleted: false
expect(matchStage.$match.isDeleted).toBe(false);
```

> "Test này không chỉ kiểm tra output — mà còn kiểm tra **cách service truy vấn DB**. Dù mock không thật sự lọc data, ta verify rằng câu query được viết đúng. Nếu developer quên điều kiện `isDeleted: false`, test này sẽ phát hiện ngay."

---

## SLIDE 10 — DEMO: SUITE 8 — BUG DETECTION ❌

**Nói:**
> "Đây là phần mình muốn nhấn mạnh nhất. Sau khi viết xong các test happy path và business rule, chúng ta chủ động nghĩ: *'Còn edge case nào service chưa xử lý?'* — rồi viết test cho những case đó. Kết quả là 4 test FAIL, chỉ ra 4 bug thật trong production code."

---

**TC23 — Bug: `secretValue` rỗng không bị từ chối**

```typescript
test("TC23 [BUG] – secretValue rỗng phải throw AppError 400", async () => {
  await expect(
    service.addInventoryItem(USER_ID, {
      productId: PRODUCT_ID,
      secretType: "Code",
      secretValue: "",  // ← rỗng
    })
  ).rejects.toMatchObject({ statusCode: 400 });

  // ❌ FAIL: service không validate → tạo item thành công với secret rỗng
});
```

> "Bug này nguy hiểm ở chỗ: một item được tạo ra với `secretValue` rỗng — khi giao cho khách, khách nhận được... không có gì. Test chạy fail với lỗi: *'Received promise resolved instead of rejected'* — tức là service không throw mà chạy thành công."

---

**TC24 — Bug: Bulk import mảng rỗng không bị từ chối**

```typescript
await expect(
  service.addBulkInventory(USER_ID, PRODUCT_ID, [])  // ← mảng rỗng
).rejects.toMatchObject({ statusCode: 400 });

// ❌ FAIL: service trả { added: 0, errors: [] } — không báo lỗi
```

> "Gọi bulk import với 0 item thì API nên báo lỗi — đây rõ ràng là input sai. Nhưng service hiện tại xử lý như bình thường vì vòng lặp `for` không chạy lần nào."

---

**TC25 — Bug: Tổng stats sai khi có item Revoked**

```typescript
// Có 5 Available + 2 Reserved + 3 Delivered + 4 Revoked
(InventoryItem.aggregate as jest.Mock).mockResolvedValue([
  { _id: "Available", count: 5 },
  { _id: "Reserved",  count: 2 },
  { _id: "Delivered", count: 3 },
  { _id: "Revoked",   count: 4 },
]);

const stats = await service.getInventoryStats(USER_ID);

// total = 14 ✅ đúng
expect(stats.total).toBe(14);

// Nhưng: total PHẢI bằng tổng các field con
expect(stats.total).toBe(
  stats.available + stats.reserved + stats.delivered
  // = 5 + 2 + 3 = 10 ≠ 14
);
// ❌ FAIL: Expected 10, Received 14
// Lý do: service không có field `revoked` trong object trả về
//        → 4 item Revoked "mất tích" khỏi breakdown
```

> "Bug này ảnh hưởng đến dashboard của seller — họ thấy total là 14 nhưng cộng các con số lại chỉ ra 10. Khó debug vì nhìn UI thấy sai số nhưng không rõ tại đâu."

---

**TC26 — Bug: Lỗi validation từ Mongoose không được xử lý thành AppError**

```typescript
// Mongoose ném ValidationError khi secretType không hợp lệ
mockItem.save = jest.fn().mockRejectedValue(
  Object.assign(new Error("Validation failed: secretType is not valid"), {
    name: "ValidationError",
  })
);

await expect(
  service.updateInventoryItem(USER_ID, ITEM_ID, {
    secretType: "InvalidType",  // ← không trong enum
  })
).rejects.toMatchObject({ statusCode: 400 });

// ❌ FAIL: service không bắt ValidationError
//          → lỗi bubble lên thô, không có statusCode
//          → client nhận 500 Internal Server Error thay vì 400 Bad Request
```

> "Bug này khiến API trả về lỗi 500 không rõ ràng thay vì 400 với message cụ thể. Client không biết mình làm sai gì."

---

## SLIDE 11 — KẾT QUẢ CHẠY

**Chạy lệnh:**
```bash
npm test
```

**Output thực tế:**

```
FAIL src/__tests__/inventory/inventory.service.test.ts

  InventoryService – Luồng quản lý kho
    addInventoryItem()
      ✓ TC01 – Thêm item thành công                         (8ms)
      ✓ TC02 – Seller không có shop → 403                   (2ms)
      ✓ TC03 – Shop chưa Active → 403, query đúng           (1ms)
      ✓ TC04 – Product không thuộc shop → 404               (1ms)
      ✓ TC05 – secretValue được mã hóa trước khi lưu       (2ms)
    addBulkInventory()
      ✓ TC06 – Bulk 3 items thành công                      (3ms)
      ✓ TC07 – Item 2 lỗi: added=2, errors=['Item 2:...']  (2ms)
      ✓ TC08 – Không có shop → 403                          (1ms)
    updateInventoryItem()
      ✓ TC09 – Cập nhật Available thành công                (2ms)
      ✓ TC10 – Reserved → 400                               (1ms)
      ✓ TC11 – Delivered → 400                              (1ms)
      ✓ TC12 – Không thuộc shop → 404                       (1ms)
    deleteInventoryItem()
      ✓ TC13 – Soft delete Available: isDeleted=true         (2ms)
      ✓ TC14 – Reserved → 400                               (1ms)
      ✓ TC15 – Item không tồn tại → 404                    (1ms)
    getInventoryStats()
      ✓ TC16 – Stats chính xác                              (2ms)
      ✓ TC17 – Không có shop → tất cả 0                    (1ms)
      ✓ TC18 – Pipeline có isDeleted=false                  (1ms)
    getAvailableCount()
      ✓ TC19 – Đếm đúng số Available                       (1ms)
      ✓ TC20 – Query có isDeleted=false                     (1ms)
    getMyInventory()
      ✓ TC21 – Không có shop → { items:[], total:0 }        (1ms)
      ✓ TC22 – Danh sách đã được decrypt                    (2ms)
    Bug Detection ❌
      ✗ TC23 [BUG] – secretValue rỗng phải throw 400        (5ms)
      ✗ TC24 [BUG] – Mảng items rỗng phải throw 400         (3ms)
      ✗ TC25 [BUG] – total ≠ available+reserved+delivered   (2ms)
      ✗ TC26 [BUG] – ValidationError không thành AppError   (4ms)

Tests:  4 failed, 22 passed, 26 total
Time:   4.2s
```

---

## SLIDE 12 — PHÂN TÍCH KẾT QUẢ

**22 PASS** — Xác nhận:
- Tất cả luồng chính hoạt động đúng
- Business rules được bảo vệ (không sửa/xóa Reserved, mã hóa secret...)
- Authorization hoạt động (403 đúng chỗ, 404 đúng chỗ)

**4 FAIL** — Phát hiện:

| Bug | Mức độ | Hậu quả nếu lên production |
|---|---|---|
| TC23: `secretValue` rỗng | Cao | Khách nhận item trống, seller bị dispute |
| TC24: Bulk import rỗng | Thấp | API return success nhầm, khó debug |
| TC25: Stats thiếu Revoked | Trung bình | Dashboard seller hiển thị số liệu sai |
| TC26: ValidationError thô | Trung bình | Client nhận 500, không biết mình sai chỗ nào |

---

## SLIDE 13 — MINH HỌA RED → GREEN (nếu có thời gian)

> "Trong TDD — Test Driven Development, vòng lặp là: **Red → Green → Refactor**. Mình sẽ demo fix nhanh TC23 để thấy vòng lặp này."

**Hiện tại — service không validate:**

```typescript
async addInventoryItem(userId: string, input: CreateInventoryInput) {
  const shop = await this.getShopByOwner(userId);
  // ... không check secretValue
  const encryptedSecret = encryptSecret(input.secretValue); // chạy với ""
}
```

**Fix — thêm validation:**

```typescript
async addInventoryItem(userId: string, input: CreateInventoryInput) {
  // ✅ Thêm validation
  if (!input.secretValue || input.secretValue.trim() === "") {
    throw new AppError("secretValue không được để trống", 400);
  }
  const shop = await this.getShopByOwner(userId);
  // ...
}
```

**Chạy lại:**
```
✓ TC23 [BUG] – secretValue rỗng phải throw 400   ← từ ❌ thành ✅
Tests: 3 failed, 23 passed, 26 total
```

> "Đó là Red → Green. Sau khi fix thêm 3 bug còn lại, toàn bộ 26 test sẽ pass."

---

## SLIDE 14 — KẾT LUẬN

**Tổng kết những gì đã làm:**

| Hạng mục | Chi tiết |
|---|---|
| Framework | Jest + ts-jest |
| Loại test | Unit Test với Mock |
| Số test cases | 26 (22 pass, 4 fail có chủ đích) |
| Thời gian chạy | ~4 giây |
| Bug phát hiện | 4 lỗi thiếu validation thật trong service |

**Bài học:**

> "Unit test không chỉ để xác nhận code đúng — quan trọng hơn là để **phát hiện sớm những gì code chưa làm đúng** trước khi lên production. 4 bug trong demo hôm nay, nếu không có test, chỉ được phát hiện khi khách hàng report — lúc đó cost để fix cao hơn rất nhiều."

---

## GỢI Ý Q&A

Các câu hỏi thường gặp và cách trả lời:

**Q: Tại sao chọn Unit Test mà không phải Integration Test hay E2E?**
> "Unit test nhanh, dễ viết, dễ locate lỗi. Integration test và E2E sẽ bổ sung ở tầng cao hơn — kiểm tra nhiều layer cùng lúc. Ba loại này bổ sung cho nhau theo mô hình Testing Pyramid, không thay thế nhau."

**Q: Mock như vậy thì có đảm bảo code chạy đúng với DB thật không?**
> "Unit test chỉ đảm bảo logic của service đúng. Để đảm bảo tích hợp với DB thật, cần thêm Integration Test — dùng MongoDB in-memory hoặc test database riêng. Đó là bước tiếp theo sau unit test."

**Q: Nếu service thay đổi logic, test có cần viết lại không?**
> "Nếu thay đổi behavior (output khác với cùng input), test phải cập nhật — đó là dấu hiệu breaking change cần xem xét. Nếu chỉ refactor nội bộ mà behavior giữ nguyên, test không cần sửa — đó chính là giá trị của test: bảo vệ behavior qua các lần refactor."

---

> **Lưu ý khi trình bày:** Chiếu terminal thật, chạy `npm test` live trước mặt người nghe.
> Output màu đỏ/xanh của Jest trực quan hơn bất kỳ slide nào.
