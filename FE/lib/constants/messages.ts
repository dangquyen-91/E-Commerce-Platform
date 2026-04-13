/**
 * System-wide Messages Constants
 * Tất cả các thông báo trong hệ thống (error, success, validation) được tập trung tại đây
 * để đảm bảo tính nhất quán và dễ quản lý
 */

export const MESSAGES = {
  // Success Messages
  SUCCESS: {
    USER_REGISTERED: "Đăng ký thành công",
    SELLER_REGISTERED: "Đăng ký seller thành công",
    LOGIN_SUCCESS: "Đăng nhập thành công",
    LOGOUT_SUCCESS: "Đăng xuất thành công",
    PASSWORD_CHANGED: "Đổi mật khẩu thành công",
    PROFILE_UPDATED: "Cập nhật hồ sơ thành công",
    SHOP_CREATED: "Tạo shop thành công",
    SHOP_UPDATED: "Cập nhật shop thành công",
    SHOP_APPROVED: "Shop đã được duyệt",
    SHOP_REJECTED: "Shop đã bị từ chối",
    PRODUCT_CREATED: "Tạo sản phẩm thành công, đang chờ duyệt",
    PRODUCT_UPDATED: "Cập nhật sản phẩm thành công",
    PRODUCT_DELETED: "Xóa sản phẩm thành công",
    ORDER_CREATED: "Đặt hàng thành công",
    ORDER_CANCELLED: "Hủy đơn hàng thành công",
    PAYMENT_SUCCESS: "Thanh toán thành công",
    WALLET_TOPUP_SUCCESS: "Nạp tiền thành công",
    WALLET_WITHDRAW_SUCCESS: "Rút tiền thành công",
    TICKET_CREATED: "Tạo ticket thành công",
    TICKET_UPDATED: "Cập nhật ticket thành công",
    REVIEW_SUBMITTED: "Đánh giá thành công",
  },

  // Error Messages - Authentication
  ERROR: {
    AUTH: {
      NO_TOKEN: "Không tìm thấy token xác thực",
      INVALID_TOKEN: "Token không hợp lệ",
      UNAUTHORIZED: "Bạn chưa đăng nhập",
      FORBIDDEN: "Bạn không có quyền thực hiện hành động này",
      USER_NOT_FOUND_OR_INACTIVE: "Tài khoản không tồn tại hoặc không hoạt động",
      EMAIL_ALREADY_EXISTS: "Email đã được sử dụng",
      INVALID_EMAIL_OR_PASSWORD: "Email hoặc mật khẩu không đúng",
      ACCOUNT_LOCKED_OR_BANNED: "Tài khoản đã bị khóa hoặc cấm",
      REFRESH_TOKEN_REQUIRED: "Cần refresh token",
      INVALID_REFRESH_TOKEN: "Refresh token không hợp lệ",
      CURRENT_PASSWORD_INCORRECT: "Mật khẩu hiện tại không đúng",
      USER_ROLE_NOT_FOUND: "Không tìm thấy vai trò người dùng",
      USER_ROLE_CONFIG_ERROR: "Lỗi cấu hình vai trò người dùng",
      INVALID_ROLE: "Vai trò không hợp lệ",
      LOGIN_FAILED: "Đăng nhập thất bại",
      SESSION_EXPIRED: "Phiên đăng nhập đã hết hạn",
    },

    // Error Messages - User
    USER: {
      NOT_FOUND: "Không tìm thấy người dùng",
      TRUST_LEVEL_INVALID: "Mức độ tin cậy phải từ 0 đến 100",
      UPDATE_FAILED: "Cập nhật thông tin thất bại",
    },

    // Error Messages - Shop
    SHOP: {
      NOT_FOUND: "Không tìm thấy shop",
      ALREADY_EXISTS: "Bạn đã có shop",
      ACCESS_DENIED: "Không có quyền truy cập shop này",
      NAME_ALREADY_EXISTS: "Tên shop đã tồn tại. Vui lòng chọn tên khác.",
      CREATE_FAILED: "Tạo shop thất bại",
      UPDATE_FAILED: "Cập nhật shop thất bại",
    },

    // Error Messages - Product
    PRODUCT: {
      NOT_FOUND: "Không tìm thấy sản phẩm",
      SHOP_NOT_FOUND_OR_ACCESS_DENIED: "Không tìm thấy shop hoặc không có quyền truy cập",
      PLATFORM_NOT_FOUND: "Không tìm thấy nền tảng",
      CREATE_FAILED: "Tạo sản phẩm thất bại",
      UPDATE_FAILED: "Cập nhật sản phẩm thất bại",
      DELETE_FAILED: "Xóa sản phẩm thất bại",
      OUT_OF_STOCK: "Sản phẩm đã hết hàng",
    },

    // Error Messages - Order
    ORDER: {
      NOT_FOUND: "Không tìm thấy đơn hàng",
      CREATE_FAILED: "Đặt hàng thất bại",
      CANCEL_FAILED: "Hủy đơn hàng thất bại",
      ALREADY_CANCELLED: "Đơn hàng đã bị hủy",
      ALREADY_COMPLETED: "Đơn hàng đã hoàn thành",
      INSUFFICIENT_BALANCE: "Số dư không đủ",
    },

    // Error Messages - Wallet
    WALLET: {
      NOT_FOUND: "Không tìm thấy ví",
      INSUFFICIENT_BALANCE: "Số dư không đủ",
      TOPUP_FAILED: "Nạp tiền thất bại",
      WITHDRAW_FAILED: "Rút tiền thất bại",
      INVALID_AMOUNT: "Số tiền không hợp lệ",
    },

    // Error Messages - Ticket
    TICKET: {
      NOT_FOUND: "Không tìm thấy ticket",
      CREATE_FAILED: "Tạo ticket thất bại",
      UPDATE_FAILED: "Cập nhật ticket thất bại",
      ALREADY_CLOSED: "Ticket đã đóng",
    },

    // Error Messages - Review
    REVIEW: {
      NOT_FOUND: "Không tìm thấy đánh giá",
      CREATE_FAILED: "Gửi đánh giá thất bại",
      ALREADY_REVIEWED: "Bạn đã đánh giá sản phẩm này",
    },

    // Error Messages - General
    GENERAL: {
      ROUTE_NOT_FOUND: "Không tìm thấy trang",
      INTERNAL_SERVER_ERROR: "Lỗi hệ thống. Vui lòng thử lại sau.",
      TOO_MANY_REQUESTS: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
      TOO_MANY_AUTH_ATTEMPTS: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau.",
      NETWORK_ERROR: "Lỗi kết nối. Vui lòng kiểm tra mạng.",
      UNKNOWN_ERROR: "Đã xảy ra lỗi. Vui lòng thử lại.",
    },
  },
} as const;

// Re-export validation messages for convenience
export { VALIDATION_MESSAGES } from "./validation-messages";
