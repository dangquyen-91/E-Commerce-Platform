/**
 * Shop Status Constants
 * Trạng thái của shop được định nghĩa tại đây để dễ đọc và quản lý
 * Non-tech friendly nhưng dev vẫn hiểu được
 */

export const SHOP_STATUS = {
  // Đang chờ duyệt - Khi người dùng đăng ký làm seller
  PENDING: "Pending" as const,
  
  // Đã được duyệt và đang hoạt động - Shop có thể bán hàng
  ACTIVE: "Active" as const,
  
  // Bị tạm ngưng - Shop bị moderator/admin tạm dừng hoạt động
  SUSPENDED: "Suspended" as const,
  
  // Đã đóng - Shop đã ngừng hoạt động hoặc bị từ chối
  CLOSED: "Closed" as const,
} as const;

/**
 * Labels tiếng Việt cho các trạng thái - Dùng cho hiển thị UI
 */
export const SHOP_STATUS_LABELS: Record<typeof SHOP_STATUS[keyof typeof SHOP_STATUS], string> = {
  [SHOP_STATUS.PENDING]: "Chờ duyệt",
  [SHOP_STATUS.ACTIVE]: "Đang hoạt động",
  [SHOP_STATUS.SUSPENDED]: "Tạm ngưng",
  [SHOP_STATUS.CLOSED]: "Đã đóng",
};

/**
 * Descriptions chi tiết cho từng trạng thái
 */
export const SHOP_STATUS_DESCRIPTIONS: Record<typeof SHOP_STATUS[keyof typeof SHOP_STATUS], string> = {
  [SHOP_STATUS.PENDING]: "Đơn đăng ký đang chờ moderator xem xét và duyệt",
  [SHOP_STATUS.ACTIVE]: "Shop đã được duyệt và có thể bán hàng",
  [SHOP_STATUS.SUSPENDED]: "Shop bị tạm ngưng hoạt động do vi phạm",
  [SHOP_STATUS.CLOSED]: "Shop đã ngừng hoạt động hoặc bị từ chối",
};
