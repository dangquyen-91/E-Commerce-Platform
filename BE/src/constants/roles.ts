/**
 * Role Constants
 * Centralized definition of role keys and related constants
 */

export const ROLE_KEYS = {
  CUSTOMER: "CUSTOMER",
  SELLER: "SELLER",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
} as const;

export const ROLE_STATUS = {
  ACTIVE: "Active",
  HIDDEN: "Hidden",
} as const;

export const ROLE_NAMES = {
  CUSTOMER: "Khách hàng",
  SELLER: "Người bán",
  ADMIN: "Quản trị viên",
  MODERATOR: "Kiểm duyệt viên",
} as const;

export const ROLE_DESCRIPTIONS = {
  CUSTOMER: "Người dùng mua hàng",
  SELLER: "Người bán sản phẩm",
  ADMIN: "Quản trị hệ thống",
  MODERATOR: "Kiểm duyệt nội dung",
} as const;

export const USER_STATUS = {
  ACTIVE: "Active",
  LOCKED: "Locked",
  BANNED: "Banned",
} as const;
