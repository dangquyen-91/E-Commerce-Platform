/**
 * Validation Messages Constants
 * Tất cả các thông báo validation được tập trung tại đây để dễ quản lý và thay đổi
 */

export const VALIDATION_MESSAGES = {
  // Authentication
  AUTH: {
    EMAIL_INVALID: "Email không hợp lệ",
    EMAIL_REQUIRED: "Vui lòng nhập email",
    PASSWORD_REQUIRED: "Mật khẩu không được để trống",
    PASSWORD_MIN_LENGTH: "Mật khẩu phải có ít nhất 8 ký tự",
    PASSWORD_MAX_LENGTH: "Mật khẩu không được vượt quá 128 ký tự",
    PASSWORD_LOWERCASE: "Mật khẩu phải có ít nhất 1 chữ thường",
    PASSWORD_UPPERCASE: "Mật khẩu phải có ít nhất 1 chữ hoa",
    PASSWORD_NUMBER: "Mật khẩu phải có ít nhất 1 số",
    PASSWORD_SPECIAL: "Mật khẩu phải có ít nhất 1 ký tự đặc biệt",
    PASSWORD_MISMATCH: "Mật khẩu không khớp",
    NAME_MIN_LENGTH: "Tên phải có ít nhất 2 ký tự",
    NAME_MAX_LENGTH: "Tên không được quá 100 ký tự",
    VERIFY_CODE_LENGTH: "Mã xác thực phải có 6 ký tự",
    CURRENT_PASSWORD_REQUIRED: "Vui lòng nhập mật khẩu hiện tại",
    REFRESH_TOKEN_REQUIRED: "Cần refresh token",
  },

  // User
  USER: {
    FULL_NAME_MIN: "Họ tên phải có ít nhất 2 ký tự",
    FULL_NAME_MAX: "Họ tên không được quá 100 ký tự",
    PHONE_INVALID: "Số điện thoại phải có 10-11 chữ số",
    AVATAR_URL_INVALID: "URL ảnh đại diện không hợp lệ",
  },

  // Product
  PRODUCT: {
    TITLE_MIN_LENGTH: "Tiêu đề phải có ít nhất 5 ký tự",
    TITLE_MAX_LENGTH: "Tiêu đề không được quá 200 ký tự",
    DESCRIPTION_MIN_LENGTH: "Mô tả phải có ít nhất 20 ký tự",
    PRICE_MIN: "Giá phải lớn hơn hoặc bằng 0",
    SHOP_REQUIRED: "Vui lòng chọn shop",
    SHOP_ID_REQUIRED: "Vui lòng chọn shop",
    PLATFORM_REQUIRED: "Vui lòng chọn nền tảng",
    PLATFORM_ID_REQUIRED: "Vui lòng chọn nền tảng",
    WARRANTY_POLICY_MIN_LENGTH: "Chính sách bảo hành phải có ít nhất 10 ký tự",
    HOW_TO_USE_MIN_LENGTH: "Hướng dẫn sử dụng phải có ít nhất 10 ký tự",
    PLAN_TYPE_REQUIRED: "Vui lòng chọn loại gói",
    PLAN_TYPE_INVALID: "Loại gói phải là: Personal, Family, Slot, Shared, InviteLink",
    DURATION_DAYS_MIN: "Thời hạn phải ít nhất 1 ngày",
    DURATION_DAYS_MAX: "Thời hạn không được quá 3650 ngày (10 năm)",
    DURATION_DAYS_INTEGER: "Thời hạn phải là số nguyên",
  },

  // Shop
  SHOP: {
    NAME_MIN_LENGTH: "Tên shop phải có ít nhất 2 ký tự",
    NAME_MAX_LENGTH: "Tên shop không được quá 100 ký tự",
    DESCRIPTION_MAX_LENGTH: "Mô tả không được quá 500 ký tự",
    LOGO_INVALID_URL: "URL logo không hợp lệ",
  },

  // Order
  ORDER: {
    ITEMS_EMPTY: "Giỏ hàng trống",
    QUANTITY_MIN: "Số lượng phải lớn hơn 0",
  },

  // Ticket
  TICKET: {
    SUBJECT_MIN_LENGTH: "Tiêu đề phải có ít nhất 5 ký tự",
    SUBJECT_MAX_LENGTH: "Tiêu đề không được quá 200 ký tự",
    DESCRIPTION_MIN_LENGTH: "Mô tả phải có ít nhất 20 ký tự",
    MESSAGE_REQUIRED: "Tin nhắn không được để trống",
  },

  // Complaint
  COMPLAINT: {
    ORDER_ITEM_REQUIRED: "Vui lòng chọn sản phẩm cần khiếu nại",
    TITLE_MIN_LENGTH: "Tiêu đề phải có ít nhất 5 ký tự",
    TITLE_MAX_LENGTH: "Tiêu đề không được quá 200 ký tự",
    CONTENT_MIN_LENGTH: "Nội dung phải có ít nhất 20 ký tự",
    CATEGORY_REQUIRED: "Vui lòng chọn loại khiếu nại",
    APPEAL_REASON_MIN: "Lý do kháng cáo phải có ít nhất 20 ký tự",
    DECISION_REASON_MIN: "Lý do quyết định phải có ít nhất 10 ký tự",
    RESOLUTION_REQUIRED: "Vui lòng chọn hình thức xử lý",
  },

  // Wallet
  WALLET: {
    AMOUNT_REQUIRED: "Vui lòng nhập số tiền",
    AMOUNT_INVALID: "Số tiền không hợp lệ",
    AMOUNT_MIN_DEPOSIT: "Số tiền tối thiểu là 50,000 VND",
    AMOUNT_MAX_DEPOSIT: "Số tiền tối đa là 50,000,000 VND",
    AMOUNT_MIN_WITHDRAWAL: "Số tiền tối thiểu là 50,000 VND",
    AMOUNT_MAX_WITHDRAWAL: "Số tiền tối đa là 10,000,000 VND",
    AMOUNT_INTEGER: "Số tiền phải là số nguyên",
    PAYMENT_METHOD_REQUIRED: "Vui lòng chọn phương thức thanh toán",
    BANK_ACCOUNT_MIN: "Số tài khoản phải có ít nhất 10 ký tự",
    BANK_ACCOUNT_MAX: "Số tài khoản không được quá 20 ký tự",
    BANK_NAME_REQUIRED: "Vui lòng nhập tên ngân hàng",
    ACCOUNT_HOLDER_MIN: "Tên chủ tài khoản phải có ít nhất 2 ký tự",
  },

  // Checkout
  CHECKOUT: {
    PAYMENT_METHOD_REQUIRED: "Vui lòng chọn phương thức thanh toán",
    CARD_INFO_REQUIRED: "Vui lòng điền đầy đủ thông tin thẻ",
  },

  // Search
  SEARCH: {
    PAGE_MIN: "Trang phải lớn hơn 0",
    LIMIT_MIN: "Giới hạn phải lớn hơn 0",
    LIMIT_MAX: "Giới hạn không được quá 100",
  },
} as const;
