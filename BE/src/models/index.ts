// Export all models from domain folders
// Auth models
export { default as User } from "./auth/user.model";
export type { IUser } from "./auth/user.model";
export { default as Role } from "./auth/role.model";
export type { IRole } from "./auth/role.model";

// Shop models
export { default as Shop } from "./shops/shop.model";
export type { IShop } from "./shops/shop.model";

// Product models
export { default as Product } from "./products/product.model";
export type { IProduct } from "./products/product.model";
export { default as PlatformCatalog } from "./products/platform-catalog.model";
export type { IPlatformCatalog } from "./products/platform-catalog.model";
export { default as InventoryItem } from "./products/inventory-item.model";
export type { IInventoryItem } from "./products/inventory-item.model";

// Order models
export { default as Order } from "./orders/order.model";
export type { IOrder } from "./orders/order.model";
export { default as OrderItem } from "./orders/order-item.model";
export type { IOrderItem } from "./orders/order-item.model";

// Wallet models
export { default as Wallet } from "./wallets/wallet.model";
export type { IWallet } from "./wallets/wallet.model";
export { default as WalletTransaction } from "./wallets/wallet-transaction.model";
export type { IWalletTransaction } from "./wallets/wallet-transaction.model";

// Payment models
export { default as Payment } from "./payments/payment.model";
export type { IPayment } from "./payments/payment.model";
export type { PaymentStatus, PaymentProvider } from "./payments/payment.model";

// Review models
export { default as Review } from "./reviews/review.model";
export type { IReview } from "./reviews/review.model";

// Support models
export { default as SupportTicket } from "./support/support-ticket.model";
export type { ISupportTicket } from "./support/support-ticket.model";
export { default as Conversation } from "./support/conversation.model";
export type { IConversation, IConversationUnreadCount } from "./support/conversation.model";
export { default as Message } from "./support/message.model";
export type { IMessage, IMessageAttachment } from "./support/message.model";

// Complaint models
export { default as ComplaintTimeline } from "./complaints/complaint-timeline.model";
export type { IComplaintTimeline } from "./complaints/complaint-timeline.model";
export { default as ComplaintQueue } from "./complaints/complaint-queue.model";
export type { IComplaintQueue } from "./complaints/complaint-queue.model";

// eKYC models
export { default as KycSession } from "./ekyc/kyc-session.model";
export type { IKycSession, KycStatus } from "./ekyc/kyc-session.model";
