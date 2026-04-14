/**
 * inventory.service.test.ts
 * Unit tests cho InventoryService – môn Software Testing
 *
 * Chiến lược: mock toàn bộ tầng DB (Mongoose models) và helpers mã hóa.
 * Không cần kết nối MongoDB thật → test chạy nhanh, độc lập.
 *
 * Bao gồm 26 test cases chia thành 8 nhóm:
 *   1. addInventoryItem   (TC01 – TC05)  ✅ pass
 *   2. addBulkInventory   (TC06 – TC08)  ✅ pass
 *   3. updateInventoryItem (TC09 – TC12) ✅ pass
 *   4. deleteInventoryItem (TC13 – TC15) ✅ pass
 *   5. getInventoryStats   (TC16 – TC18) ✅ pass
 *   6. getAvailableCount   (TC19 – TC20) ✅ pass
 *   7. getMyInventory      (TC21 – TC22) ✅ pass
 *   8. Bug Detection       (TC23 – TC26) ❌ fail – phát hiện lỗi thiếu validation
 */

// ─────────────────────────────────────────────────────────────────────────────
// MOCK SETUP
// Tất cả jest.mock() đều bị Jest "hoist" lên đầu file (trước import),
// nên các module được mock trước khi bất kỳ code nào khác chạy.
// ─────────────────────────────────────────────────────────────────────────────

// 1. Mock @/config/env để tránh lỗi "Missing required environment variables"
//    khi errorHandler.ts cố load config lúc import.
jest.mock("@/config/env", () => ({
  env: {
    nodeEnv: "test",
    mongoURI: "mongodb://localhost/test",
    jwtSecret: "test-jwt-secret",
    jwtExpire: "7d",
    jwtRefreshSecret: "test-refresh-secret",
    jwtRefreshExpire: "30d",
    corsOrigin: "http://localhost:3000",
    rateLimitWindowMs: 900000,
    rateLimitMaxRequests: 100,
    vnpayTmnCode: "TEST",
    vnpaySecretKey: "TEST",
    vnpayUrl: "http://sandbox.test.vn",
    vnpayReturnUrl: "http://localhost/return",
    vnpayIpnUrl: "http://localhost/ipn",
    backendUrl: "http://localhost:3001",
    ekycBaseUrl: "http://test.ekyc.vn",
    ekycAccessToken: "TEST",
    ekycTokenId: "TEST",
    ekycTokenKey: "TEST",
    ekycMacAddress: "TEST",
    cloudinaryCloudName: "TEST",
    cloudinaryApiKey: "TEST",
    cloudinaryApiSecret: "TEST",
    CRON_SECRET: "test-cron",
  },
}));

// 2. Mock toàn bộ @/models – chỉ giữ các static method cần dùng
jest.mock("@/models", () => ({
  Shop: { findOne: jest.fn() },
  Product: { findOne: jest.fn() },
  InventoryItem: {
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
}));

// 3. Mock encryptSecret / decryptSecret để kiểm soát đầu ra
//    Format giả: "enc::<plaintext>" – dễ assert trong test
jest.mock("@/utils/helpers", () => ({
  encryptSecret: jest.fn((val: string) => `enc::${val}`),
  decryptSecret: jest.fn((val: string) =>
    val.startsWith("enc::") ? val.slice(5) : val
  ),
}));

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS (sau mock)
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";
import { InventoryService } from "@/services/inventory/inventory.service";
import { Shop, Product, InventoryItem } from "@/models";
import { encryptSecret } from "@/utils/helpers";
import { AppError } from "@/middleware/errorHandler";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS – ObjectId hợp lệ (24 ký tự hex)
// ─────────────────────────────────────────────────────────────────────────────
const USER_ID     = "507f1f77bcf86cd799439011";
const SHOP_ID     = "507f1f77bcf86cd799439012";
const PRODUCT_ID  = "507f1f77bcf86cd799439013";
const PLATFORM_ID = "507f1f77bcf86cd799439014";
const ITEM_ID     = "507f1f77bcf86cd799439015";

// ─────────────────────────────────────────────────────────────────────────────
// FIXTURES
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_SHOP = {
  _id: new mongoose.Types.ObjectId(SHOP_ID),
  ownerUserId: new mongoose.Types.ObjectId(USER_ID),
  status: "Active",
  isDeleted: false,
};

const MOCK_PRODUCT = {
  _id: new mongoose.Types.ObjectId(PRODUCT_ID),
  shopId: new mongoose.Types.ObjectId(SHOP_ID),
  platformId: new mongoose.Types.ObjectId(PLATFORM_ID),
  isDeleted: false,
};

/**
 * Tạo mock InventoryItem document với save() stub.
 * Dùng overrides để tuỳ biến từng test.
 */
const makeMockItem = (overrides: Record<string, unknown> = {}) => ({
  _id: new mongoose.Types.ObjectId(ITEM_ID),
  shopId: new mongoose.Types.ObjectId(SHOP_ID),
  productId: new mongoose.Types.ObjectId(PRODUCT_ID),
  platformId: new mongoose.Types.ObjectId(PLATFORM_ID),
  secretType: "Account",
  secretValue: "enc::user@example.com",
  status: "Available",
  isDeleted: false,
  save: jest.fn().mockResolvedValue(undefined),
  ...overrides,
});

/**
 * Mock chuỗi method InventoryItem.find().populate().sort().limit().skip().lean()
 */
const mockFindChain = (items: unknown[]) => {
  const chain = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(items),
  };
  (InventoryItem.find as jest.Mock).mockReturnValue(chain);
  return chain;
};

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITES
// ─────────────────────────────────────────────────────────────────────────────
describe("InventoryService – Luồng quản lý kho", () => {
  let service: InventoryService;

  beforeEach(() => {
    service = new InventoryService();
    // Xoá trạng thái mock sau mỗi test để tránh ảnh hưởng chéo
    jest.clearAllMocks();
  });

  // =========================================================================
  // SUITE 1: addInventoryItem
  // =========================================================================
  describe("addInventoryItem()", () => {
    const VALID_INPUT = {
      productId: PRODUCT_ID,
      secretType: "Account" as const,
      secretValue: "seller@example.com",
    };

    test("TC01 – Thêm item thành công: trả về InventoryItem với status = Available", async () => {
      // Arrange
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
      (Product.findOne as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
      const createdItem = makeMockItem({ status: "Available" });
      (InventoryItem.create as jest.Mock).mockResolvedValue(createdItem);

      // Act
      const result = await service.addInventoryItem(USER_ID, VALID_INPUT);

      // Assert
      expect(result.status).toBe("Available");
      expect(InventoryItem.create).toHaveBeenCalledTimes(1);
    });

    test("TC02 – Seller không có shop → throw AppError 403", async () => {
      // Shop.findOne trả null: shop không tồn tại
      (Shop.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.addInventoryItem(USER_ID, VALID_INPUT)
      ).rejects.toThrow(AppError);

      await expect(
        service.addInventoryItem(USER_ID, VALID_INPUT)
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    test("TC03 – Shop chưa Active (query lọc status='Active' → findOne trả null) → throw AppError 403", async () => {
      // Query trong service: { ownerUserId, isDeleted: false, status: "Active" }
      // Nếu shop đang Pending/Suspended, Mongoose trả null vì không khớp status
      (Shop.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.addInventoryItem(USER_ID, VALID_INPUT)
      ).rejects.toMatchObject({ statusCode: 403 });

      // Xác nhận query được gọi với đúng filter
      const queryArg = (Shop.findOne as jest.Mock).mock.calls[0][0];
      expect(queryArg.status).toBe("Active");
      expect(queryArg.isDeleted).toBe(false);
    });

    test("TC04 – Product không thuộc shop của seller → throw AppError 404", async () => {
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
      // Product không tìm thấy (thuộc shop khác)
      (Product.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.addInventoryItem(USER_ID, VALID_INPUT)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    test("TC05 – secretValue được mã hóa trước khi lưu DB (≠ plaintext gốc)", async () => {
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
      (Product.findOne as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
      (InventoryItem.create as jest.Mock).mockResolvedValue(makeMockItem());

      await service.addInventoryItem(USER_ID, VALID_INPUT);

      // encryptSecret phải được gọi với đúng plaintext
      expect(encryptSecret).toHaveBeenCalledWith(VALID_INPUT.secretValue);

      // Giá trị truyền vào DB phải là bản đã mã hóa
      const dbPayload = (InventoryItem.create as jest.Mock).mock.calls[0][0];
      expect(dbPayload.secretValue).not.toBe(VALID_INPUT.secretValue);
      expect(dbPayload.secretValue).toBe(`enc::${VALID_INPUT.secretValue}`);
    });
  });

  // =========================================================================
  // SUITE 2: addBulkInventory
  // =========================================================================
  describe("addBulkInventory()", () => {
    const BULK_ITEMS = [
      { secretType: "Account", secretValue: "user1@test.com" },
      { secretType: "Account", secretValue: "user2@test.com" },
      { secretType: "Code",    secretValue: "CODE-ABCD-1234" },
    ];

    test("TC06 – Bulk import 3 items thành công → { added: 3, errors: [] }", async () => {
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
      (Product.findOne as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
      (InventoryItem.create as jest.Mock).mockResolvedValue(makeMockItem());

      const result = await service.addBulkInventory(USER_ID, PRODUCT_ID, BULK_ITEMS);

      expect(result.added).toBe(3);
      expect(result.errors).toHaveLength(0);
      expect(InventoryItem.create).toHaveBeenCalledTimes(3);
    });

    test("TC07 – Item thứ 2 lỗi DB → added=2, errors=['Item 2: ...']", async () => {
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
      (Product.findOne as jest.Mock).mockResolvedValue(MOCK_PRODUCT);

      // Item 1: OK | Item 2: lỗi | Item 3: OK
      (InventoryItem.create as jest.Mock)
        .mockResolvedValueOnce(makeMockItem())
        .mockRejectedValueOnce(new Error("Duplicate key"))
        .mockResolvedValueOnce(makeMockItem());

      const result = await service.addBulkInventory(USER_ID, PRODUCT_ID, BULK_ITEMS);

      expect(result.added).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toMatch(/Item 2/);
    });

    test("TC08 – Seller không có shop → throw AppError 403", async () => {
      (Shop.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.addBulkInventory(USER_ID, PRODUCT_ID, BULK_ITEMS)
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  // =========================================================================
  // SUITE 3: updateInventoryItem
  // =========================================================================
  describe("updateInventoryItem()", () => {
    test("TC09 – Cập nhật item Available thành công: secretValue được mã hóa lại", async () => {
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
      const mockItem = makeMockItem({ status: "Available" });
      (InventoryItem.findOne as jest.Mock).mockResolvedValue(mockItem);

      await service.updateInventoryItem(USER_ID, ITEM_ID, {
        secretValue: "newpassword@123",
      });

      // Đảm bảo mã hóa được gọi với giá trị mới
      expect(encryptSecret).toHaveBeenCalledWith("newpassword@123");
      // Đảm bảo document được lưu
      expect(mockItem.save).toHaveBeenCalledTimes(1);
    });

    test("TC10 – Cập nhật item đang Reserved → throw AppError 400", async () => {
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
      (InventoryItem.findOne as jest.Mock).mockResolvedValue(
        makeMockItem({ status: "Reserved" })
      );

      await expect(
        service.updateInventoryItem(USER_ID, ITEM_ID, { secretValue: "new" })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    test("TC11 – Cập nhật item đang Delivered → throw AppError 400", async () => {
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
      (InventoryItem.findOne as jest.Mock).mockResolvedValue(
        makeMockItem({ status: "Delivered" })
      );

      await expect(
        service.updateInventoryItem(USER_ID, ITEM_ID, { secretValue: "new" })
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    test("TC12 – Item không thuộc shop của seller → throw AppError 404", async () => {
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
      // findOne trả null: item không tìm thấy trong shop
      (InventoryItem.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.updateInventoryItem(USER_ID, ITEM_ID, { secretValue: "new" })
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // =========================================================================
  // SUITE 4: deleteInventoryItem (soft delete)
  // =========================================================================
  describe("deleteInventoryItem()", () => {
    test("TC13 – Xóa (soft delete) item Available: isDeleted=true, return true", async () => {
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
      const mockItem = makeMockItem({ status: "Available", isDeleted: false });
      (InventoryItem.findOne as jest.Mock).mockResolvedValue(mockItem);

      const result = await service.deleteInventoryItem(USER_ID, ITEM_ID);

      expect(result).toBe(true);
      // isDeleted phải được set thành true (soft delete)
      expect(mockItem.isDeleted).toBe(true);
      // document phải được gọi save()
      expect(mockItem.save).toHaveBeenCalledTimes(1);
    });

    test("TC14 – Xóa item đang Reserved → throw AppError 400 (bảo vệ đơn hàng)", async () => {
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
      (InventoryItem.findOne as jest.Mock).mockResolvedValue(
        makeMockItem({ status: "Reserved" })
      );

      await expect(
        service.deleteInventoryItem(USER_ID, ITEM_ID)
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    test("TC15 – Xóa item không tồn tại → throw AppError 404", async () => {
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
      (InventoryItem.findOne as jest.Mock).mockResolvedValue(null);

      await expect(
        service.deleteInventoryItem(USER_ID, ITEM_ID)
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  // =========================================================================
  // SUITE 5: getInventoryStats
  // =========================================================================
  describe("getInventoryStats()", () => {
    test("TC16 – Có đủ 3 loại status: tổng hợp chính xác total/available/reserved/delivered", async () => {
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
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
    });

    test("TC17 – Seller không có shop → trả về tất cả 0 (không throw)", async () => {
      (Shop.findOne as jest.Mock).mockResolvedValue(null);

      const stats = await service.getInventoryStats(USER_ID);

      expect(stats).toEqual({
        total: 0,
        available: 0,
        reserved: 0,
        delivered: 0,
      });
    });

    test("TC18 – Aggregate pipeline có điều kiện isDeleted=false (không đếm item đã xóa)", async () => {
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
      (InventoryItem.aggregate as jest.Mock).mockResolvedValue([
        { _id: "Available", count: 7 },
      ]);

      await service.getInventoryStats(USER_ID);

      // Lấy pipeline được truyền vào aggregate()
      const pipeline: Array<Record<string, unknown>> =
        (InventoryItem.aggregate as jest.Mock).mock.calls[0][0];
      const matchStage = pipeline.find(
        (stage) => "$match" in stage
      ) as { $match: Record<string, unknown> };

      // Pipeline PHẢI lọc isDeleted: false
      expect(matchStage.$match.isDeleted).toBe(false);
    });
  });

  // =========================================================================
  // SUITE 6: getAvailableCount
  // =========================================================================
  describe("getAvailableCount()", () => {
    test("TC19 – Đếm đúng số item Available của product", async () => {
      (InventoryItem.countDocuments as jest.Mock).mockResolvedValue(3);

      const count = await service.getAvailableCount(PRODUCT_ID);

      expect(count).toBe(3);
      // Query phải có status: "Available"
      expect(InventoryItem.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ status: "Available" })
      );
    });

    test("TC20 – Query luôn có isDeleted=false (không đếm item đã bị xóa mềm)", async () => {
      (InventoryItem.countDocuments as jest.Mock).mockResolvedValue(2);

      await service.getAvailableCount(PRODUCT_ID);

      const queryArg = (InventoryItem.countDocuments as jest.Mock).mock
        .calls[0][0];
      expect(queryArg.isDeleted).toBe(false);
    });
  });

  // =========================================================================
  // SUITE 7: getMyInventory
  // =========================================================================
  describe("getMyInventory()", () => {
    test("TC21 – Seller không có shop → trả về { items: [], total: 0 } (không throw)", async () => {
      (Shop.findOne as jest.Mock).mockResolvedValue(null);

      const result = await service.getMyInventory(USER_ID);

      expect(result).toEqual({ items: [], total: 0 });
    });

    test("TC22 – Danh sách trả về đã được decrypt secretValue", async () => {
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);

      // DB lưu bản đã mã hóa
      const encryptedItems = [
        { ...makeMockItem(), secretValue: "enc::user1@test.com" },
      ];
      mockFindChain(encryptedItems);
      (InventoryItem.countDocuments as jest.Mock).mockResolvedValue(1);

      const result = await service.getMyInventory(USER_ID, {
        status: "Available",
      });

      expect(result.total).toBe(1);
      // Seller phải nhận được bản đã giải mã
      expect(result.items[0].secretValue).toBe("user1@test.com");
    });
  });

  // =========================================================================
  // SUITE 8: Bug Detection – Các lỗi thiếu validation trong service
  // ❌ Các test dưới đây DỰ KIẾN FAIL vì service chưa xử lý edge case.
  //    Mục đích: chỉ ra những chỗ cần cải thiện trong production code.
  // =========================================================================
  describe("Bug Detection – Các lỗi thiếu validation ❌", () => {

    test("TC23 [BUG] – addInventoryItem với secretValue rỗng phải throw AppError 400", async () => {
      // BUG: Service không kiểm tra secretValue rỗng trước khi mã hóa và lưu DB.
      //      encryptSecret("") vẫn chạy bình thường → item được tạo với secret trống.
      // EXPECT: Phải throw AppError 400 – "secretValue không được để trống"
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
      (Product.findOne as jest.Mock).mockResolvedValue(MOCK_PRODUCT);
      (InventoryItem.create as jest.Mock).mockResolvedValue(makeMockItem());

      await expect(
        service.addInventoryItem(USER_ID, {
          productId: PRODUCT_ID,
          secretType: "Code",
          secretValue: "", // ← giá trị rỗng
        })
      ).rejects.toMatchObject({ statusCode: 400 });
      // ❌ FAIL: service không throw, tạo item thành công với secret rỗng
    });

    test("TC24 [BUG] – addBulkInventory với danh sách items rỗng phải throw AppError 400", async () => {
      // BUG: Service không validate mảng items trước khi vào vòng lặp.
      //      Gọi với [] → vòng for không chạy → trả { added: 0, errors: [] } thành công.
      // EXPECT: Phải throw AppError 400 – "Danh sách items không được rỗng"
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
      (Product.findOne as jest.Mock).mockResolvedValue(MOCK_PRODUCT);

      await expect(
        service.addBulkInventory(USER_ID, PRODUCT_ID, []) // ← mảng rỗng
      ).rejects.toMatchObject({ statusCode: 400 });
      // ❌ FAIL: service trả { added: 0, errors: [] } thay vì throw
    });

    test("TC25 [BUG] – getInventoryStats: total phải bằng tổng tất cả status (kể cả Revoked)", async () => {
      // BUG: Service tính total = sum(mọi status) nhưng object trả về không có field
      //      `revoked`. Khi có Revoked items: total > available + reserved + delivered.
      // EXPECT: total === available + reserved + delivered + revoked
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
      (InventoryItem.aggregate as jest.Mock).mockResolvedValue([
        { _id: "Available", count: 5 },
        { _id: "Reserved",  count: 2 },
        { _id: "Delivered", count: 3 },
        { _id: "Revoked",   count: 4 }, // ← 4 item bị thu hồi
      ]);

      const stats = await service.getInventoryStats(USER_ID);

      // total = 5+2+3+4 = 14, nhưng available+reserved+delivered = 10
      expect(stats.total).toBe(14); // ✅ đúng
      // ❌ FAIL dòng dưới: stats không có field `revoked`, TypeScript báo lỗi
      // và phép tính sẽ sai (14 !== 10)
      expect(stats.total).toBe(
        stats.available + stats.reserved + stats.delivered
        // thiếu + stats.revoked vì service không return field này
      );
    });

    test("TC26 [BUG] – updateInventoryItem với secretType không hợp lệ phải throw AppError 400", async () => {
      // BUG: Service chỉ gán updates.secretType trực tiếp vào document mà
      //      không validate xem có nằm trong enum ["Account","InviteLink","Code","QR"].
      //      Giá trị sai sẽ bị Mongoose từ chối ở tầng DB (khi save()), nhưng
      //      service không bắt và convert thành AppError có statusCode rõ ràng.
      // EXPECT: Phải throw AppError 400 trước khi gọi save()
      (Shop.findOne as jest.Mock).mockResolvedValue(MOCK_SHOP);
      const mockItem = makeMockItem({ status: "Available" });
      // Giả lập Mongoose ném lỗi validation khi save với type sai
      mockItem.save = jest.fn().mockRejectedValue(
        Object.assign(new Error("Validation failed: secretType is not valid"), {
          name: "ValidationError",
        })
      );
      (InventoryItem.findOne as jest.Mock).mockResolvedValue(mockItem);

      await expect(
        service.updateInventoryItem(USER_ID, ITEM_ID, {
          secretType: "InvalidType", // ← không nằm trong enum
        })
      ).rejects.toMatchObject({ statusCode: 400 });
      // ❌ FAIL: service không bắt ValidationError → rejects với Error thường
      //          (không có statusCode), toMatchObject({ statusCode: 400 }) fail
    });
  });
});
