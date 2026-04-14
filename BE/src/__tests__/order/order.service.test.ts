/**
 * order.service.test.ts
 * Unit tests cho OrderService – phần Thanh toán sản phẩm
 *
 * Chiến lược: mock toàn bộ tầng DB (Mongoose models), session, walletService.
 * Không cần kết nối MongoDB thật → test chạy nhanh, độc lập.
 *
 * Bao gồm 30 test cases chia thành 7 nhóm:
 *   1. createOrder – Thanh toán 1 sản phẩm qua Wallet            (TC01 – TC05)
 *   2. createOrder – Thanh toán nhiều sản phẩm qua Wallet        (TC06 – TC09)
 *   3. createOrder – Ví không đủ số dư → cần nạp qua Payment     (TC10 – TC12)
 *   4. createOrder – Thanh toán qua cổng (VNPay/Momo)            (TC13 – TC15)
 *   5. cancelOrderByBuyer                                         (TC16 – TC20)
 *   6. cancelOrderBySeller                                        (TC21 – TC25)
 *   7. confirmDelivery & getOrderById                             (TC26 – TC30)
 */

// ─────────────────────────────────────────────────────────────────────────────
// MOCK SETUP  (jest.mock bị hoist lên trước import – luôn để ở đây)
// ─────────────────────────────────────────────────────────────────────────────

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

jest.mock("@/models", () => ({
  Order: {
    create: jest.fn(),
    findById: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
    updateMany: jest.fn(),
  },
  OrderItem: {
    create: jest.fn(),
    find: jest.fn(),
    findById: jest.fn(),
    countDocuments: jest.fn(),
    updateMany: jest.fn(),
  },
  Product: {
    find: jest.fn(),
  },
  Wallet: {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
  WalletTransaction: {
    create: jest.fn(),
  },
  InventoryItem: {
    countDocuments: jest.fn(),
    find: jest.fn(),
    bulkWrite: jest.fn(),
    findOne: jest.fn(),
    updateMany: jest.fn(),
  },
  Shop: {
    findOne: jest.fn(),
  },
  User: {},
}));

jest.mock("@/services/wallets/wallet.service", () => ({
  walletService: {
    getOrCreateWallet: jest.fn(),
    topUp: jest.fn(),
  },
}));

jest.mock("@/services/shops/shop.service", () => ({
  ShopService: jest.fn().mockImplementation(() => ({
    incrementSales: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock("@/utils/helpers", () => ({
  decryptSecret: jest.fn((val: string) =>
    val.startsWith("enc::") ? val.slice(5) : val
  ),
  encryptSecret: jest.fn((val: string) => `enc::${val}`),
}));

jest.mock("@/constants", () => ({
  createLogger: jest.fn(() => ({
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
  LOG_PREFIXES: { ORDER_SERVICE: "ORDER_SERVICE" },
}));

// ─────────────────────────────────────────────────────────────────────────────
// IMPORTS
// ─────────────────────────────────────────────────────────────────────────────
import mongoose from "mongoose";
import { OrderService } from "@/services/orders/order.service";
import {
  Order,
  OrderItem,
  Product,
  Wallet,
  WalletTransaction,
  InventoryItem,
} from "@/models";
import { walletService } from "@/services/wallets/wallet.service";
import { AppError } from "@/middleware/errorHandler";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const CUSTOMER_ID   = "507f1f77bcf86cd799439001";
const SELLER_ID     = "507f1f77bcf86cd799439002";
const SHOP_ID       = "507f1f77bcf86cd799439003";
const PRODUCT_ID_1  = "507f1f77bcf86cd799439011";
const PRODUCT_ID_2  = "507f1f77bcf86cd799439012";
const PLATFORM_ID   = "507f1f77bcf86cd799439020";
const WALLET_ID     = "507f1f77bcf86cd799439030";
const ORDER_ID      = "507f1f77bcf86cd799439040";
const ORDER_ITEM_ID = "507f1f77bcf86cd799439050";
const INV_ITEM_ID_1 = "507f1f77bcf86cd799439061";
const INV_ITEM_ID_2 = "507f1f77bcf86cd799439062";

// ─────────────────────────────────────────────────────────────────────────────
// FIXTURES
// ─────────────────────────────────────────────────────────────────────────────
const MOCK_PRODUCT_1 = {
  _id: new mongoose.Types.ObjectId(PRODUCT_ID_1),
  title: "Netflix Premium 1 tháng",
  price: 150000,
  shopId: new mongoose.Types.ObjectId(SHOP_ID),
  platformId: new mongoose.Types.ObjectId(PLATFORM_ID),
  status: "Approved",
  isDeleted: false,
};

const MOCK_PRODUCT_2 = {
  _id: new mongoose.Types.ObjectId(PRODUCT_ID_2),
  title: "Spotify Premium 1 tháng",
  price: 80000,
  shopId: new mongoose.Types.ObjectId(SHOP_ID),
  platformId: new mongoose.Types.ObjectId(PLATFORM_ID),
  status: "Approved",
  isDeleted: false,
};

const MOCK_WALLET_SUFFICIENT = {
  _id: new mongoose.Types.ObjectId(WALLET_ID),
  userId: new mongoose.Types.ObjectId(CUSTOMER_ID),
  balance: 500000,
  holdBalance: 0,
  currency: "VND",
};

const MOCK_WALLET_INSUFFICIENT = {
  _id: new mongoose.Types.ObjectId(WALLET_ID),
  userId: new mongoose.Types.ObjectId(CUSTOMER_ID),
  balance: 10000, // quá thấp
  holdBalance: 0,
  currency: "VND",
};

const MOCK_WALLET_EMPTY = {
  _id: new mongoose.Types.ObjectId(WALLET_ID),
  userId: new mongoose.Types.ObjectId(CUSTOMER_ID),
  balance: 0,
  holdBalance: 0,
  currency: "VND",
};

const makeInvItem = (id: string) => ({
  _id: new mongoose.Types.ObjectId(id),
  shopId: new mongoose.Types.ObjectId(SHOP_ID),
  platformId: new mongoose.Types.ObjectId(PLATFORM_ID),
  secretValue: "enc::user123:pass456",
  secretType: "Username/Password",
  status: "Available",
  isDeleted: false,
  save: jest.fn(),
});

const MOCK_ORDER = {
  _id: new mongoose.Types.ObjectId(ORDER_ID),
  orderCode: "ORD-TEST-0001",
  customerUserId: new mongoose.Types.ObjectId(CUSTOMER_ID),
  totalAmount: 150000,
  feeAmount: 7500,
  payableAmount: 150000,
  status: "Paid",
  paymentProvider: "Wallet",
  paidAt: new Date(),
  createdAt: new Date(),
};

const MOCK_ORDER_PENDING = {
  ...MOCK_ORDER,
  status: "PendingPayment",
  paymentProvider: "Vnpay",
  paidAt: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// MOCK SESSION
// ─────────────────────────────────────────────────────────────────────────────
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

jest.spyOn(mongoose, "startSession").mockResolvedValue(mockSession as any);

// Helper: gắn .session() cho mock
const withSession = (mockFn: jest.Mock) =>
  mockFn.mockReturnValue({ session: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) });

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Setup mock cho createOrder thanh toán Wallet thành công */
function setupSuccessfulWalletOrder(products = [MOCK_PRODUCT_1], invItems = [makeInvItem(INV_ITEM_ID_1)]) {
  // Product.find trả về danh sách sản phẩm, hỗ trợ .session()
  (Product.find as jest.Mock).mockReturnValue({
    session: jest.fn().mockResolvedValue(products),
  });

  // InventoryItem.countDocuments
  (InventoryItem.countDocuments as jest.Mock).mockReturnValue({
    session: jest.fn().mockResolvedValue(invItems.length),
  });

  // walletService.getOrCreateWallet
  (walletService.getOrCreateWallet as jest.Mock).mockResolvedValue(MOCK_WALLET_SUFFICIENT);

  // Order.create
  (Order.create as jest.Mock).mockResolvedValue([MOCK_ORDER]);

  // InventoryItem.find – trả về inventory items
  (InventoryItem.find as jest.Mock).mockReturnValue({
    limit: jest.fn().mockReturnThis(),
    session: jest.fn().mockResolvedValue(invItems),
  });

  // InventoryItem.bulkWrite
  (InventoryItem.bulkWrite as jest.Mock).mockResolvedValue({});

  // OrderItem.create
  const mockOrderItems = invItems.map((inv, i) => ({
    _id: new mongoose.Types.ObjectId(),
    orderId: MOCK_ORDER._id,
    inventoryItemId: inv._id,
    itemStatus: "Delivered",
    holdStatus: "Holding",
    holdAmount: products[0]?.price || 150000,
  }));
  (OrderItem.create as jest.Mock).mockResolvedValue(mockOrderItems);

  // Wallet.findByIdAndUpdate
  (Wallet.findByIdAndUpdate as jest.Mock).mockReturnValue({
    session: jest.fn().mockResolvedValue(MOCK_WALLET_SUFFICIENT),
  });

  // WalletTransaction.create
  (WalletTransaction.create as jest.Mock).mockResolvedValue([{}]);
}

// ─────────────────────────────────────────────────────────────────────────────
// TEST SUITES
// ─────────────────────────────────────────────────────────────────────────────

describe("OrderService", () => {
  let service: OrderService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new OrderService();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NHÓM 1 – Thanh toán 1 sản phẩm qua Ví
  // ═══════════════════════════════════════════════════════════════════════════
  describe("TC01–TC05 | createOrder – thanh toán 1 sản phẩm qua Wallet", () => {
    it("TC01 – Thanh toán 1 sản phẩm thành công: order status = Paid, itemStatus = Delivered", async () => {
      setupSuccessfulWalletOrder();

      const result = await service.createOrder(CUSTOMER_ID, {
        items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
        paymentMethod: "Wallet",
      });

      expect(result.order).toBeDefined();
      expect(result.orderItems).toBeDefined();
      expect(result.orderItems.length).toBe(1);
      expect(result.orderItems[0].itemStatus).toBe("Delivered");
    });

    it("TC02 – Ví bị trừ đúng số tiền (balance -= payableAmount, holdBalance += payableAmount)", async () => {
      setupSuccessfulWalletOrder();

      await service.createOrder(CUSTOMER_ID, {
        items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
        paymentMethod: "Wallet",
      });

      expect(Wallet.findByIdAndUpdate).toHaveBeenCalledWith(
        MOCK_WALLET_SUFFICIENT._id,
        expect.objectContaining({
          $inc: { balance: -150000, holdBalance: 150000 },
        }),
        expect.any(Object)
      );
    });

    it("TC03 – WalletTransaction được tạo với type='Hold' và direction='Out'", async () => {
      setupSuccessfulWalletOrder();

      await service.createOrder(CUSTOMER_ID, {
        items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
        paymentMethod: "Wallet",
      });

      expect(WalletTransaction.create).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: "Hold", direction: "Out" }),
        ]),
        expect.any(Object)
      );
    });

    it("TC04 – Sản phẩm không tồn tại hoặc không được duyệt → throw AppError 400", async () => {
      (Product.find as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue([]), // trả về rỗng
      });

      await expect(
        service.createOrder(CUSTOMER_ID, {
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          paymentMethod: "Wallet",
        })
      ).rejects.toThrow(AppError);
    });

    it("TC05 – Kho hết hàng (availableInventory = 0) → throw AppError 400", async () => {
      (Product.find as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue([MOCK_PRODUCT_1]),
      });
      (InventoryItem.countDocuments as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(0),
      });
      (walletService.getOrCreateWallet as jest.Mock).mockResolvedValue(MOCK_WALLET_SUFFICIENT);

      await expect(
        service.createOrder(CUSTOMER_ID, {
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          paymentMethod: "Wallet",
        })
      ).rejects.toThrow(AppError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NHÓM 2 – Thanh toán nhiều sản phẩm qua Ví
  // ═══════════════════════════════════════════════════════════════════════════
  describe("TC06–TC09 | createOrder – thanh toán nhiều sản phẩm qua Wallet", () => {
    it("TC06 – Đặt 2 loại sản phẩm khác nhau (mỗi loại 1 quantity): tổng tiền đúng", async () => {
      const products = [MOCK_PRODUCT_1, MOCK_PRODUCT_2];
      const invItems = [makeInvItem(INV_ITEM_ID_1), makeInvItem(INV_ITEM_ID_2)];
      const limitMock1 = jest.fn().mockReturnThis();
      const limitMock2 = jest.fn().mockReturnThis();

      (Product.find as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(products),
      });
      (InventoryItem.countDocuments as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(1),
      });
      (walletService.getOrCreateWallet as jest.Mock).mockResolvedValue(MOCK_WALLET_SUFFICIENT);
      (Order.create as jest.Mock).mockResolvedValue([{
        ...MOCK_ORDER,
        totalAmount: 230000, // 150000 + 80000
        feeAmount: 11500,
        payableAmount: 230000,
      }]);
      (InventoryItem.find as jest.Mock)
        .mockReturnValueOnce({
          limit: limitMock1,
          session: jest.fn().mockResolvedValue([invItems[0]]),
        })
        .mockReturnValueOnce({
          limit: limitMock2,
          session: jest.fn().mockResolvedValue([invItems[1]]),
        });
      (InventoryItem.bulkWrite as jest.Mock).mockResolvedValue({});
      (OrderItem.create as jest.Mock).mockResolvedValue([
        {
          itemStatus: "Delivered",
          holdAmount: 150000,
          inventoryItemId: invItems[0]._id,
        },
        {
          itemStatus: "Delivered",
          holdAmount: 80000,
          inventoryItemId: invItems[1]._id,
        },
      ]);
      (Wallet.findByIdAndUpdate as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(MOCK_WALLET_SUFFICIENT),
      });
      (WalletTransaction.create as jest.Mock).mockResolvedValue([{}]);

      const result = await service.createOrder(CUSTOMER_ID, {
        items: [
          { productId: PRODUCT_ID_1, quantity: 1 },
          { productId: PRODUCT_ID_2, quantity: 1 },
        ],
        paymentMethod: "Wallet",
      });

      expect(result.order.totalAmount).toBe(230000);
      expect(InventoryItem.countDocuments).toHaveBeenCalledTimes(2);
      expect(limitMock1).toHaveBeenCalledWith(1);
      expect(limitMock2).toHaveBeenCalledWith(1);
      expect(Order.create).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            totalAmount: 230000,
            feeAmount: 11500,
            payableAmount: 230000,
            status: "Paid",
            paymentProvider: "Wallet",
          }),
        ]),
        expect.any(Object)
      );
      expect(OrderItem.create).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            productId: MOCK_PRODUCT_1._id,
            quantity: 1,
            unitPrice: 150000,
            subtotal: 150000,
          }),
          expect.objectContaining({
            productId: MOCK_PRODUCT_2._id,
            quantity: 1,
            unitPrice: 80000,
            subtotal: 80000,
          }),
        ]),
        expect.any(Object)
      );
    });

    it("TC07 – Đặt 1 sản phẩm với quantity=2: InventoryItem.find được gọi với .limit(2)", async () => {
      const invItems = [makeInvItem(INV_ITEM_ID_1), makeInvItem(INV_ITEM_ID_2)];
      const limitMock = jest.fn().mockReturnThis();
      const sessionMock = jest.fn().mockResolvedValue(invItems);

      (Product.find as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue([MOCK_PRODUCT_1]),
      });
      (InventoryItem.countDocuments as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(2),
      });
      (walletService.getOrCreateWallet as jest.Mock).mockResolvedValue(MOCK_WALLET_SUFFICIENT);
      (Order.create as jest.Mock).mockResolvedValue([{
        ...MOCK_ORDER,
        totalAmount: 300000,
        payableAmount: 300000,
      }]);
      (InventoryItem.find as jest.Mock).mockReturnValue({
        limit: limitMock,
        session: sessionMock,
      });
      (InventoryItem.bulkWrite as jest.Mock).mockResolvedValue({});
      (OrderItem.create as jest.Mock).mockResolvedValue([
        { itemStatus: "Delivered" },
        { itemStatus: "Delivered" },
      ]);
      (Wallet.findByIdAndUpdate as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(MOCK_WALLET_SUFFICIENT),
      });
      (WalletTransaction.create as jest.Mock).mockResolvedValue([{}]);

      await service.createOrder(CUSTOMER_ID, {
        items: [{ productId: PRODUCT_ID_1, quantity: 2 }],
        paymentMethod: "Wallet",
      });

      expect(limitMock).toHaveBeenCalledWith(2);
    });

    it("TC08 – Yêu cầu quantity=3 nhưng kho chỉ có 2 → throw AppError", async () => {
      (Product.find as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue([MOCK_PRODUCT_1]),
      });
      // countDocuments trả về 3 (vượt qua check đầu), nhưng find trả về chỉ 2 item
      (InventoryItem.countDocuments as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(3),
      });
      (walletService.getOrCreateWallet as jest.Mock).mockResolvedValue(MOCK_WALLET_SUFFICIENT);
      (Order.create as jest.Mock).mockResolvedValue([MOCK_ORDER]);
      (InventoryItem.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        session: jest.fn().mockResolvedValue([makeInvItem(INV_ITEM_ID_1), makeInvItem(INV_ITEM_ID_2)]), // chỉ 2
      });

      await expect(
        service.createOrder(CUSTOMER_ID, {
          items: [{ productId: PRODUCT_ID_1, quantity: 3 }],
          paymentMethod: "Wallet",
        })
      ).rejects.toThrow(AppError);
    });

    it("TC09 – Mảng items rỗng: phải throw AppError 400 và không tạo order", async () => {
      await expect(
        service.createOrder(CUSTOMER_ID, {
          items: [],
          paymentMethod: "Wallet",
        })
      ).rejects.toMatchObject({ statusCode: 400 });

      expect(Product.find).not.toHaveBeenCalled();
      expect(walletService.getOrCreateWallet).not.toHaveBeenCalled();
      expect(Order.create).not.toHaveBeenCalled();
      expect(OrderItem.create).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NHÓM 3 – Ví không đủ số dư → cần nạp qua Payment
  // ═══════════════════════════════════════════════════════════════════════════
  describe("TC10–TC12 | createOrder – ví không đủ, cần nạp thêm", () => {
    it("TC10 – Ví có số dư thấp hơn giá sản phẩm → throw AppError 400 với message hướng dẫn nạp tiền", async () => {
      (Product.find as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue([MOCK_PRODUCT_1]),
      });
      (InventoryItem.countDocuments as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(1),
      });
      (walletService.getOrCreateWallet as jest.Mock).mockResolvedValue(MOCK_WALLET_INSUFFICIENT);

      let thrownError: any;
      try {
        await service.createOrder(CUSTOMER_ID, {
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          paymentMethod: "Wallet",
        });
      } catch (err) {
        thrownError = err;
      }

      expect(thrownError).toBeInstanceOf(AppError);
      expect(thrownError.statusCode).toBe(400);
      // Message phải nhắc đến số dư hiện có và số cần có
      expect(thrownError.message).toMatch(/Số dư ví không đủ/);
    });

    it("TC11 – Ví bằng 0 → throw AppError, không tạo order, không trừ tiền", async () => {
      (Product.find as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue([MOCK_PRODUCT_1]),
      });
      (InventoryItem.countDocuments as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(1),
      });
      (walletService.getOrCreateWallet as jest.Mock).mockResolvedValue(MOCK_WALLET_EMPTY);

      await expect(
        service.createOrder(CUSTOMER_ID, {
          items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
          paymentMethod: "Wallet",
        })
      ).rejects.toThrow(AppError);

      expect(Order.create).not.toHaveBeenCalled();
      expect(Wallet.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("TC12 – Ví đủ tiền chính xác bằng giá sản phẩm (balance === price) → thành công", async () => {
      const exactWallet = { ...MOCK_WALLET_SUFFICIENT, balance: 150000 };
      (Product.find as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue([MOCK_PRODUCT_1]),
      });
      (InventoryItem.countDocuments as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(1),
      });
      (walletService.getOrCreateWallet as jest.Mock).mockResolvedValue(exactWallet);
      (Order.create as jest.Mock).mockResolvedValue([MOCK_ORDER]);
      (InventoryItem.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        session: jest.fn().mockResolvedValue([makeInvItem(INV_ITEM_ID_1)]),
      });
      (InventoryItem.bulkWrite as jest.Mock).mockResolvedValue({});
      (OrderItem.create as jest.Mock).mockResolvedValue([{ itemStatus: "Delivered" }]);
      (Wallet.findByIdAndUpdate as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(exactWallet),
      });
      (WalletTransaction.create as jest.Mock).mockResolvedValue([{}]);

      const result = await service.createOrder(CUSTOMER_ID, {
        items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
        paymentMethod: "Wallet",
      });

      expect(result.order).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NHÓM 4 – Thanh toán qua cổng ngoài (VNPay/Momo)
  // ═══════════════════════════════════════════════════════════════════════════
  describe("TC13–TC15 | createOrder – thanh toán qua cổng ngoài (VNPay)", () => {
    it("TC13 – Thanh toán VNPay: order status = PendingPayment, itemStatus = WaitingDelivery", async () => {
      (Product.find as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue([MOCK_PRODUCT_1]),
      });
      (InventoryItem.countDocuments as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(1),
      });
      (Order.create as jest.Mock).mockResolvedValue([MOCK_ORDER_PENDING]);
      (InventoryItem.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        session: jest.fn().mockResolvedValue([makeInvItem(INV_ITEM_ID_1)]),
      });
      (InventoryItem.bulkWrite as jest.Mock).mockResolvedValue({});
      (OrderItem.create as jest.Mock).mockResolvedValue([{
        itemStatus: "WaitingDelivery",
        holdStatus: "Holding",
      }]);

      const result = await service.createOrder(CUSTOMER_ID, {
        items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
        paymentMethod: "Vnpay",
      });

      expect(result.order.status).toBe("PendingPayment");
      // Không gọi walletService khi dùng cổng ngoài
      expect(walletService.getOrCreateWallet).not.toHaveBeenCalled();
    });

    it("TC14 – Thanh toán VNPay: inventory bị chuyển sang status=Reserved (không phải Delivered)", async () => {
      (Product.find as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue([MOCK_PRODUCT_1]),
      });
      (InventoryItem.countDocuments as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(1),
      });
      (Order.create as jest.Mock).mockResolvedValue([MOCK_ORDER_PENDING]);
      const invItem = makeInvItem(INV_ITEM_ID_1);
      (InventoryItem.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        session: jest.fn().mockResolvedValue([invItem]),
      });
      (InventoryItem.bulkWrite as jest.Mock).mockResolvedValue({});
      (OrderItem.create as jest.Mock).mockResolvedValue([{ itemStatus: "WaitingDelivery" }]);

      await service.createOrder(CUSTOMER_ID, {
        items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
        paymentMethod: "Vnpay",
      });

      // bulkWrite phải set status = "Reserved"
      expect(InventoryItem.bulkWrite).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            updateOne: expect.objectContaining({
              update: expect.objectContaining({
                $set: expect.objectContaining({ status: "Reserved" }),
              }),
            }),
          }),
        ]),
        expect.any(Object)
      );
    });

    it("TC15 – Thanh toán Momo: không gọi Wallet.findByIdAndUpdate", async () => {
      (Product.find as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue([MOCK_PRODUCT_1]),
      });
      (InventoryItem.countDocuments as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(1),
      });
      (Order.create as jest.Mock).mockResolvedValue([{ ...MOCK_ORDER_PENDING, paymentProvider: "Momo" }]);
      (InventoryItem.find as jest.Mock).mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        session: jest.fn().mockResolvedValue([makeInvItem(INV_ITEM_ID_1)]),
      });
      (InventoryItem.bulkWrite as jest.Mock).mockResolvedValue({});
      (OrderItem.create as jest.Mock).mockResolvedValue([{ itemStatus: "WaitingDelivery" }]);

      await service.createOrder(CUSTOMER_ID, {
        items: [{ productId: PRODUCT_ID_1, quantity: 1 }],
        paymentMethod: "Momo",
      });

      expect(Wallet.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(WalletTransaction.create).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NHÓM 5 – cancelOrderByBuyer
  // ═══════════════════════════════════════════════════════════════════════════
  describe("TC16–TC20 | cancelOrderByBuyer", () => {
    const MOCK_ORDER_ITEMS = [
      {
        _id: new mongoose.Types.ObjectId(ORDER_ITEM_ID),
        orderId: MOCK_ORDER._id,
        inventoryItemId: new mongoose.Types.ObjectId(INV_ITEM_ID_1),
        itemStatus: "WaitingDelivery",
        holdStatus: "Holding",
        holdAmount: 150000,
      },
    ];

    it("TC16 – Buyer hủy đơn PendingPayment thành công, không hoàn tiền", async () => {
      const pendingOrder = { ...MOCK_ORDER, status: "PendingPayment" };
      (Order.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(pendingOrder),
      });
      (OrderItem.find as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(MOCK_ORDER_ITEMS),
      });
      (OrderItem.updateMany as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue({}),
      });
      (InventoryItem.updateMany as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue({}),
      });
      (Order.findByIdAndUpdate as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue({}),
      });

      const result = await service.cancelOrderByBuyer(ORDER_ID, CUSTOMER_ID, "Đổi ý");

      expect(result.success).toBe(true);
      expect(Wallet.findOne).not.toHaveBeenCalled(); // Không hoàn tiền
    });

    it("TC17 – Buyer hủy đơn Paid: tiền được hoàn từ holdBalance về balance", async () => {
      (Order.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(MOCK_ORDER),
      });
      (OrderItem.find as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(MOCK_ORDER_ITEMS),
      });
      (Wallet.findOne as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(MOCK_WALLET_SUFFICIENT),
      });
      (Wallet.findByIdAndUpdate as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue({}),
      });
      (WalletTransaction.create as jest.Mock).mockResolvedValue([{}]);
      (OrderItem.updateMany as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue({}),
      });
      (InventoryItem.updateMany as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue({}),
      });
      (Order.findByIdAndUpdate as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue({}),
      });

      const result = await service.cancelOrderByBuyer(ORDER_ID, CUSTOMER_ID, "Muốn đổi sản phẩm");

      expect(result.success).toBe(true);
      expect(Wallet.findByIdAndUpdate).toHaveBeenCalledWith(
        MOCK_WALLET_SUFFICIENT._id,
        expect.objectContaining({
          $inc: { holdBalance: -150000, balance: 150000 },
        }),
        expect.any(Object)
      );
    });

    it("TC18 – Buyer khác cố hủy đơn không thuộc về mình → throw AppError 403", async () => {
      const ANOTHER_CUSTOMER = "507f1f77bcf86cd799439099";
      (Order.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(MOCK_ORDER), // belongs to CUSTOMER_ID
      });

      await expect(
        service.cancelOrderByBuyer(ORDER_ID, ANOTHER_CUSTOMER, "lý do")
      ).rejects.toThrow(AppError);
    });

    it("TC19 – Hủy đơn đã Completed → throw AppError 400", async () => {
      (Order.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue({ ...MOCK_ORDER, status: "Completed" }),
      });

      await expect(
        service.cancelOrderByBuyer(ORDER_ID, CUSTOMER_ID, "lý do")
      ).rejects.toThrow(AppError);
    });

    it("TC20 – Hủy đơn có item đã giao (itemStatus=Delivered) → throw AppError 400", async () => {
      (Order.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(MOCK_ORDER),
      });
      (OrderItem.find as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue([
          { ...MOCK_ORDER_ITEMS[0], itemStatus: "Delivered" },
        ]),
      });

      await expect(
        service.cancelOrderByBuyer(ORDER_ID, CUSTOMER_ID, "lý do")
      ).rejects.toThrow(AppError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NHÓM 6 – cancelOrderBySeller
  // ═══════════════════════════════════════════════════════════════════════════
  describe("TC21–TC25 | cancelOrderBySeller", () => {
    const mockShop = {
      _id: new mongoose.Types.ObjectId(SHOP_ID),
      ownerUserId: new mongoose.Types.ObjectId(SELLER_ID),
    };

    const mockOrderItemsWithShop = [
      {
        _id: new mongoose.Types.ObjectId(ORDER_ITEM_ID),
        orderId: MOCK_ORDER._id,
        inventoryItemId: new mongoose.Types.ObjectId(INV_ITEM_ID_1),
        shopId: mockShop,
        itemStatus: "Delivered",
        holdStatus: "Holding",
        holdAmount: 150000,
      },
    ];

    it("TC21 – Seller hủy đơn Paid trong 24h: thành công, hoàn tiền về balance khách", async () => {
      (Order.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(MOCK_ORDER),
      });
      (OrderItem.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        session: jest.fn().mockResolvedValue(mockOrderItemsWithShop),
      });
      (InventoryItem.findOne as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(null),
      });
      (Wallet.findOne as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(MOCK_WALLET_SUFFICIENT),
      });
      (Wallet.findByIdAndUpdate as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue({}),
      });
      (WalletTransaction.create as jest.Mock).mockResolvedValue([{}]);
      (OrderItem.updateMany as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue({}),
      });
      (InventoryItem.updateMany as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue({}),
      });
      (Order.findByIdAndUpdate as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue({}),
      });

      const result = await service.cancelOrderBySeller(ORDER_ID, SELLER_ID, "Hết hàng đột xuất");

      expect(result.success).toBe(true);
      expect(Wallet.findByIdAndUpdate).toHaveBeenCalled();
    });

    it("TC22 – Seller hủy đơn sau 24h → throw AppError 400", async () => {
      const oldOrder = {
        ...MOCK_ORDER,
        createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000), // 25h trước
      };
      (Order.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(oldOrder),
      });
      (OrderItem.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        session: jest.fn().mockResolvedValue(mockOrderItemsWithShop),
      });
      (InventoryItem.findOne as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.cancelOrderBySeller(ORDER_ID, SELLER_ID, "lý do")
      ).rejects.toThrow(AppError);
    });

    it("TC23 – Seller không sở hữu đơn hàng → throw AppError 403", async () => {
      const ANOTHER_SELLER = "507f1f77bcf86cd799439099";
      (Order.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(MOCK_ORDER),
      });
      (OrderItem.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        session: jest.fn().mockResolvedValue(mockOrderItemsWithShop), // shop thuộc SELLER_ID
      });
      (InventoryItem.findOne as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.cancelOrderBySeller(ORDER_ID, ANOTHER_SELLER, "lý do")
      ).rejects.toThrow(AppError);
    });

    it("TC24 – Hủy đơn không tồn tại → throw AppError 404", async () => {
      (Order.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.cancelOrderBySeller("nonexistent", SELLER_ID, "lý do")
      ).rejects.toThrow(AppError);
    });

    it("TC25 – Hủy đơn PendingPayment (chưa thanh toán) → throw AppError (chỉ được hủy đơn Paid)", async () => {
      (Order.findById as jest.Mock).mockReturnValue({
        session: jest.fn().mockResolvedValue(MOCK_ORDER_PENDING),
      });

      await expect(
        service.cancelOrderBySeller(ORDER_ID, SELLER_ID, "lý do")
      ).rejects.toThrow(AppError);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // NHÓM 7 – confirmDelivery & getOrderById
  // ═══════════════════════════════════════════════════════════════════════════
  describe("TC26–TC30 | confirmDelivery & getOrderById", () => {
    it("TC26 – confirmDelivery thành công: itemStatus chuyển thành Completed", async () => {
      const mockItem = {
        _id: new mongoose.Types.ObjectId(ORDER_ITEM_ID),
        orderId: {
          _id: MOCK_ORDER._id,
          customerUserId: new mongoose.Types.ObjectId(CUSTOMER_ID),
        },
        itemStatus: "Delivered",
        save: jest.fn().mockResolvedValue(undefined),
      };
      (OrderItem.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockItem),
      });

      const result = await service.confirmDelivery(ORDER_ITEM_ID, CUSTOMER_ID);

      expect(result.itemStatus).toBe("Completed");
      expect(mockItem.save).toHaveBeenCalled();
    });

    it("TC27 – confirmDelivery với item chưa được giao (WaitingDelivery) → throw AppError 400", async () => {
      const mockItem = {
        _id: new mongoose.Types.ObjectId(ORDER_ITEM_ID),
        orderId: {
          _id: MOCK_ORDER._id,
          customerUserId: new mongoose.Types.ObjectId(CUSTOMER_ID),
        },
        itemStatus: "WaitingDelivery",
        save: jest.fn(),
      };
      (OrderItem.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockItem),
      });

      await expect(
        service.confirmDelivery(ORDER_ITEM_ID, CUSTOMER_ID)
      ).rejects.toThrow(AppError);
    });

    it("TC28 – confirmDelivery bởi người dùng khác → throw AppError 403", async () => {
      const ANOTHER_USER = "507f1f77bcf86cd799439099";
      const mockItem = {
        _id: new mongoose.Types.ObjectId(ORDER_ITEM_ID),
        orderId: {
          _id: MOCK_ORDER._id,
          customerUserId: new mongoose.Types.ObjectId(CUSTOMER_ID),
        },
        itemStatus: "Delivered",
        save: jest.fn(),
      };
      (OrderItem.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockItem),
      });

      await expect(
        service.confirmDelivery(ORDER_ITEM_ID, ANOTHER_USER)
      ).rejects.toThrow(AppError);
    });

    it("TC29 – getOrderById với orderId tồn tại: trả về order + items", async () => {
      const mockItems = [
        {
          _id: new mongoose.Types.ObjectId(),
          itemStatus: "Delivered",
          subtotal: 150000,
        },
        {
          _id: new mongoose.Types.ObjectId(),
          itemStatus: "WaitingDelivery",
          subtotal: 80000,
        },
      ];
      const populateShopMock = jest.fn().mockResolvedValue(mockItems);
      const populateProductMock = jest.fn().mockReturnValue({
        populate: populateShopMock,
      });

      (Order.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(MOCK_ORDER),
      });
      (OrderItem.find as jest.Mock).mockReturnValue({
        populate: populateProductMock,
      });

      const result = await service.getOrderById(ORDER_ID);

      expect(result).not.toBeNull();
      expect(result?.order).toEqual(MOCK_ORDER);
      expect(result?.items).toEqual(mockItems);
      expect(OrderItem.find).toHaveBeenCalledWith({ orderId: ORDER_ID });
      expect(populateProductMock).toHaveBeenCalledWith("productId");
      expect(populateShopMock).toHaveBeenCalledWith("shopId");
    });

    it("TC30 – getOrderById với orderId không tồn tại → trả về null", async () => {
      (Order.findById as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const result = await service.getOrderById("nonexistent-id");

      expect(result).toBeNull();
    });
  });
});