/**
 * Payment Service
 * Handles payment operations including top-up via VNPay
 */

import { apiClient } from "../api";

export interface CreateTopUpRequest {
  amount: number;
}

export interface CreateTopUpResponse {
  payment: {
    id: string;
    transactionRef: string;
    amount: number;
    status: string;
    createdAt: string;
  };
  paymentUrl: string;
}

export interface PaymentStatusResponse {
  id: string;
  transactionRef: string;
  amount: number;
  status: string;
  provider: string;
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
}

export interface WalletBalanceResponse {
  balance: number;
  holdBalance: number;
  totalBalance: number;
  currency: string;
}

export interface WalletTransactionResponse {
  id: string;
  type: string;
  direction: "In" | "Out";
  amount: number;
  note?: string;
  createdAt: string;
}

class PaymentService {
  /**
   * Create top-up payment request
   */
  async createTopUp(data: CreateTopUpRequest): Promise<CreateTopUpResponse> {
    const response = await apiClient.post<CreateTopUpResponse>("/payments/topup", data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to create payment");
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionRef: string): Promise<PaymentStatusResponse> {
    const response = await apiClient.get<PaymentStatusResponse>(`/payments/${transactionRef}`);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to get payment status");
  }

  /**
   * Get user payments
   */
  async getUserPayments(options?: {
    limit?: number;
    skip?: number;
    status?: string;
  }): Promise<PaymentStatusResponse[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.skip) params.append("skip", options.skip.toString());
    if (options?.status) params.append("status", options.status);

    const queryString = params.toString();
    const url = `/payments${queryString ? `?${queryString}` : ""}`;
    
    const response = await apiClient.get<PaymentStatusResponse[]>(url);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to get payments");
  }

  /**
   * Get wallet balance
   */
  async getWalletBalance(): Promise<WalletBalanceResponse> {
    const response = await apiClient.get<WalletBalanceResponse>("/payments/wallets/balance");
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to get wallet balance");
  }

  /**
   * Get wallet transactions
   */
  async getWalletTransactions(options?: {
    limit?: number;
    skip?: number;
    type?: string;
  }): Promise<WalletTransactionResponse[]> {
    const params = new URLSearchParams();
    if (options?.limit) params.append("limit", options.limit.toString());
    if (options?.skip) params.append("skip", options.skip.toString());
    if (options?.type) params.append("type", options.type);

    const queryString = params.toString();
    const url = `/payments/wallets/transactions${queryString ? `?${queryString}` : ""}`;
    
    const response = await apiClient.get<WalletTransactionResponse[]>(url);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || "Failed to get wallet transactions");
  }
}

export const paymentService = new PaymentService();
