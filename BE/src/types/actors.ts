/**
 * Actor Interfaces - Define capabilities and data flows for each system actor
 */

import { PERMISSIONS } from "@/constants/permissions";

/**
 * Guest Actor Interface
 * - No authentication required
 * - Limited read-only access
 */
export interface IGuestCapabilities {
  // Data flows: Guest → E-Commerce Platform
  canRegister: boolean;
  canLogin: boolean;
  canSearch: boolean;
  canBrowse: boolean;
  canViewProductDetails: boolean;
  canViewShopDetails: boolean;
  canViewReviews: boolean;
  canViewPlatformCatalog: boolean;

  // Data flows: E-Commerce Platform → Guest
  receivesProductList: boolean;
  receivesProductDetails: boolean;
  receivesSearchResults: boolean;
  receivesRegistrationResult: boolean;
  receivesLoginResult: boolean;
}

export const GuestCapabilities: IGuestCapabilities = {
  canRegister: true,
  canLogin: true,
  canSearch: true,
  canBrowse: true,
  canViewProductDetails: true,
  canViewShopDetails: true,
  canViewReviews: true,
  canViewPlatformCatalog: true,
  receivesProductList: true,
  receivesProductDetails: true,
  receivesSearchResults: true,
  receivesRegistrationResult: true,
  receivesLoginResult: true,
};

/**
 * Customer Actor Interface
 * - Requires authentication and verification
 * - Full shopping and order management capabilities
 */
export interface ICustomerCapabilities {
  // Profile Management
  canViewProfile: boolean;
  canUpdateProfile: boolean;

  // Shopping Cart
  canViewCart: boolean;
  canAddToCart: boolean;
  canUpdateCart: boolean;
  canRemoveFromCart: boolean;

  // Order Management
  canCreateOrder: boolean;
  canViewOrders: boolean;
  canCancelOrder: boolean;
  canTrackOrder: boolean;

  // Payment
  canInitiatePayment: boolean;
  canConfirmPayment: boolean;

  // Wallet
  canViewWallet: boolean;
  canTopUpWallet: boolean;
  canViewWalletTransactions: boolean;

  // Support
  canCreateTicket: boolean;
  canViewTickets: boolean;
  canUpdateTicket: boolean;
  canCloseTicket: boolean;

  // Reviews & Reports
  canCreateReview: boolean;
  canUpdateReview: boolean;
  canDeleteReview: boolean;
  canCreateReport: boolean;

  // Communication
  canViewConversations: boolean;
  canCreateConversation: boolean;
  canSendMessage: boolean;

  // Refunds
  canRequestRefund: boolean;

  // Guest capabilities (inherited)
  canSearch: boolean;
  canBrowse: boolean;
  canViewProductDetails: boolean;
  canViewShopDetails: boolean;
  canViewReviews: boolean;
  canViewPlatformCatalog: boolean;
}

export const CustomerCapabilities: ICustomerCapabilities = {
  canViewProfile: true,
  canUpdateProfile: true,
  canViewCart: true,
  canAddToCart: true,
  canUpdateCart: true,
  canRemoveFromCart: true,
  canCreateOrder: true,
  canViewOrders: true,
  canCancelOrder: true,
  canTrackOrder: true,
  canInitiatePayment: true,
  canConfirmPayment: true,
  canViewWallet: true,
  canTopUpWallet: true,
  canViewWalletTransactions: true,
  canCreateTicket: true,
  canViewTickets: true,
  canUpdateTicket: true,
  canCloseTicket: true,
  canCreateReview: true,
  canUpdateReview: true,
  canDeleteReview: true,
  canCreateReport: true,
  canViewConversations: true,
  canCreateConversation: true,
  canSendMessage: true,
  canRequestRefund: true,
  canSearch: true,
  canBrowse: true,
  canViewProductDetails: true,
  canViewShopDetails: true,
  canViewReviews: true,
  canViewPlatformCatalog: true,
};

/**
 * Seller Actor Interface
 * - Requires shop registration and approval
 * - Product and inventory management
 * - Order processing and delivery
 */
export interface ISellerCapabilities {
  // Shop Management
  canCreateShop: boolean;
  canUpdateShop: boolean;
  canViewOwnShop: boolean;

  // Product Management
  canCreateProduct: boolean;
  canUpdateProduct: boolean;
  canDeleteProduct: boolean;
  canViewOwnProducts: boolean;

  // Inventory Management
  canViewInventory: boolean;
  canAddInventory: boolean;
  canUpdateInventory: boolean;
  canDeleteInventory: boolean;

  // Order Management
  canViewOwnOrders: boolean;
  canProcessOrder: boolean;
  canDeliverOrder: boolean;
  canUpdateOrderStatus: boolean;

  // Analytics & Reports
  canViewSalesReports: boolean;
  canViewShopAnalytics: boolean;

  // Payout
  canRequestPayout: boolean;
  canViewPayouts: boolean;

  // Communication
  canViewSellerConversations: boolean;
  canSendSellerMessage: boolean;

  // Public capabilities (inherited)
  canSearch: boolean;
  canBrowse: boolean;
  canViewProductDetails: boolean;
  canViewShopDetails: boolean;
  canViewReviews: boolean;
  canViewPlatformCatalog: boolean;
}

export const SellerCapabilities: ISellerCapabilities = {
  canCreateShop: true,
  canUpdateShop: true,
  canViewOwnShop: true,
  canCreateProduct: true,
  canUpdateProduct: true,
  canDeleteProduct: true,
  canViewOwnProducts: true,
  canViewInventory: true,
  canAddInventory: true,
  canUpdateInventory: true,
  canDeleteInventory: true,
  canViewOwnOrders: true,
  canProcessOrder: true,
  canDeliverOrder: true,
  canUpdateOrderStatus: true,
  canViewSalesReports: true,
  canViewShopAnalytics: true,
  canRequestPayout: true,
  canViewPayouts: true,
  canViewSellerConversations: true,
  canSendSellerMessage: true,
  canSearch: true,
  canBrowse: true,
  canViewProductDetails: true,
  canViewShopDetails: true,
  canViewReviews: true,
  canViewPlatformCatalog: true,
};

/**
 * Moderator Actor Interface
 * - Content moderation and review
 * - Report handling
 * - User and shop restrictions
 */
export interface IModeratorCapabilities {
  // Product Moderation
  canApproveProduct: boolean;
  canRejectProduct: boolean;
  canModerateProduct: boolean;

  // Review Moderation
  canModerateReview: boolean;
  canHideReview: boolean;
  canDeleteReview: boolean;

  // Comment Moderation
  canModerateComment: boolean;
  canHideComment: boolean;
  canDeleteComment: boolean;

  // Report Handling
  canViewReports: boolean;
  canReviewReport: boolean;
  canResolveReport: boolean;
  canRejectReport: boolean;

  // Shop Management
  canSuspendShop: boolean;
  canUnsuspendShop: boolean;

  // User Restrictions
  canRestrictUser: boolean;
  canUnrestrictUser: boolean;

  // General
  canModerateContent: boolean;

  // Public capabilities (inherited)
  canSearch: boolean;
  canBrowse: boolean;
  canViewProductDetails: boolean;
  canViewShopDetails: boolean;
  canViewReviews: boolean;
  canViewPlatformCatalog: boolean;
}

export const ModeratorCapabilities: IModeratorCapabilities = {
  canApproveProduct: true,
  canRejectProduct: true,
  canModerateProduct: true,
  canModerateReview: true,
  canHideReview: true,
  canDeleteReview: true,
  canModerateComment: true,
  canHideComment: true,
  canDeleteComment: true,
  canViewReports: true,
  canReviewReport: true,
  canResolveReport: true,
  canRejectReport: true,
  canSuspendShop: true,
  canUnsuspendShop: true,
  canRestrictUser: true,
  canUnrestrictUser: true,
  canModerateContent: true,
  canSearch: true,
  canBrowse: true,
  canViewProductDetails: true,
  canViewShopDetails: true,
  canViewReviews: true,
  canViewPlatformCatalog: true,
};

/**
 * Admin Actor Interface
 * - Full system administration
 * - User and role management
 * - System configuration
 */
export interface IAdminCapabilities {
  // User Management
  canViewUsers: boolean;
  canCreateUser: boolean;
  canUpdateUser: boolean;
  canDeleteUser: boolean;
  canLockUser: boolean;
  canUnlockUser: boolean;
  canBanUser: boolean;
  canUnbanUser: boolean;

  // Role & Permission Management
  canViewRoles: boolean;
  canCreateRole: boolean;
  canUpdateRole: boolean;
  canDeleteRole: boolean;
  canViewPermissions: boolean;
  canAssignPermission: boolean;
  canRevokePermission: boolean;

  // Category Management
  canViewCategories: boolean;
  canCreateCategory: boolean;
  canUpdateCategory: boolean;
  canDeleteCategory: boolean;

  // Platform Catalog Management
  canManagePlatformCatalog: boolean;

  // Seller Management
  canApproveSeller: boolean;
  canRejectSeller: boolean;
  canViewSellerApplications: boolean;

  // Policy Management
  canViewPolicies: boolean;
  canUpdatePolicies: boolean;

  // System Configuration
  canViewSystemConfig: boolean;
  canUpdateSystemConfig: boolean;
  canManageAISystem: boolean;

  // Audit & Monitoring
  canViewAuditLogs: boolean;
  canViewAnalytics: boolean;
  canMonitorSystem: boolean;

  // Order Management
  canViewAllOrders: boolean;
  canManageOrders: boolean;

  // Wallet Management
  canViewAllWallets: boolean;
  canAdjustWallet: boolean;

  // Payout Management
  canApprovePayout: boolean;
  canRejectPayout: boolean;
  canViewAllPayouts: boolean;

  // Refund Management
  canApproveRefund: boolean;
  canRejectRefund: boolean;
  canViewAllRefunds: boolean;

  // All other capabilities (inherited)
  canSearch: boolean;
  canBrowse: boolean;
  canViewProductDetails: boolean;
  canViewShopDetails: boolean;
  canViewReviews: boolean;
  canViewPlatformCatalog: boolean;
}

export const AdminCapabilities: IAdminCapabilities = {
  canViewUsers: true,
  canCreateUser: true,
  canUpdateUser: true,
  canDeleteUser: true,
  canLockUser: true,
  canUnlockUser: true,
  canBanUser: true,
  canUnbanUser: true,
  canViewRoles: true,
  canCreateRole: true,
  canUpdateRole: true,
  canDeleteRole: true,
  canViewPermissions: true,
  canAssignPermission: true,
  canRevokePermission: true,
  canViewCategories: true,
  canCreateCategory: true,
  canUpdateCategory: true,
  canDeleteCategory: true,
  canManagePlatformCatalog: true,
  canApproveSeller: true,
  canRejectSeller: true,
  canViewSellerApplications: true,
  canViewPolicies: true,
  canUpdatePolicies: true,
  canViewSystemConfig: true,
  canUpdateSystemConfig: true,
  canManageAISystem: true,
  canViewAuditLogs: true,
  canViewAnalytics: true,
  canMonitorSystem: true,
  canViewAllOrders: true,
  canManageOrders: true,
  canViewAllWallets: true,
  canAdjustWallet: true,
  canApprovePayout: true,
  canRejectPayout: true,
  canViewAllPayouts: true,
  canApproveRefund: true,
  canRejectRefund: true,
  canViewAllRefunds: true,
  canSearch: true,
  canBrowse: true,
  canViewProductDetails: true,
  canViewShopDetails: true,
  canViewReviews: true,
  canViewPlatformCatalog: true,
};

/**
 * Permission to Capability Mapping
 * Maps permissions to actor capabilities for validation
 */
export const PermissionToCapabilityMap: Record<string, keyof (ICustomerCapabilities & ISellerCapabilities & IModeratorCapabilities & IAdminCapabilities)> = {
  [PERMISSIONS.PROFILE_VIEW]: "canViewProfile",
  [PERMISSIONS.PROFILE_UPDATE]: "canUpdateProfile",
  [PERMISSIONS.CART_VIEW]: "canViewCart",
  [PERMISSIONS.CART_ADD]: "canAddToCart",
  [PERMISSIONS.CART_UPDATE]: "canUpdateCart",
  [PERMISSIONS.CART_REMOVE]: "canRemoveFromCart",
  [PERMISSIONS.ORDER_CREATE]: "canCreateOrder",
  [PERMISSIONS.ORDER_VIEW]: "canViewOrders",
  [PERMISSIONS.ORDER_CANCEL]: "canCancelOrder",
  [PERMISSIONS.ORDER_TRACK]: "canTrackOrder",
  [PERMISSIONS.SHOP_CREATE]: "canCreateShop",
  [PERMISSIONS.SHOP_UPDATE]: "canUpdateShop",
  [PERMISSIONS.PRODUCT_CREATE]: "canCreateProduct",
  [PERMISSIONS.PRODUCT_UPDATE]: "canUpdateProduct",
  [PERMISSIONS.PRODUCT_DELETE]: "canDeleteProduct",
  [PERMISSIONS.USER_VIEW]: "canViewUsers",
  [PERMISSIONS.USER_CREATE]: "canCreateUser",
  // Add more mappings as needed
};
