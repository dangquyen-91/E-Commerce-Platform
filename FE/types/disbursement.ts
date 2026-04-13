export interface DisbursementStats {
  holding: {
    count: number;
    totalAmount: number;
  };
  releasedLast30Days: {
    count: number;
    totalAmount: number;
  };
  refundedLast30Days: {
    count: number;
    totalAmount: number;
  };
  readyForDisbursement: number;
  escrowPeriodHours: number;
}

export interface HoldingItem {
  orderItemId: string;
  orderCode?: string;
  customerEmail?: string;
  customerName?: string;
  shopName?: string;
  shopId?: string;
  productTitle?: string;
  inventorySku?: string;
  itemStatus: string;
  holdAmount: number;
  holdAt: string;
  hoursHeld: number;
  timeRemainingSeconds: number;
  timeRemainingFormatted: string;
  isReadyForDisbursement: boolean;
  hasOpenComplaint: boolean;
  canDisburse: boolean;
}

export interface PendingItem {
  orderItemId: string;
  orderCode?: string;
  customerEmail?: string;
  customerName?: string;
  shopName?: string;
  productTitle?: string;
  holdAmount: number;
  holdAt: string;
  hoursHeld: number;
  hasOpenComplaint: boolean;
  canDisburse: boolean;
}

export interface DisbursementResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
  };
  summary?: {
    totalHolding: number;
    readyForDisbursement: number;
    withComplaints: number;
  };
}
