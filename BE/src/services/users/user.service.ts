import { BaseService } from "@/services/base.service";
import { User, IUser, Order, Wallet, SupportTicket } from "@/models";
import { AppError } from "@/middleware/errorHandler";
import { MESSAGES } from "@/constants/messages";
import mongoose from "mongoose";

export class UserService extends BaseService<IUser> {
  constructor() {
    super(User);
  }

  async getUserById(userId: string): Promise<IUser | null> {
    return this.model
      .findById(userId)
      .populate("roleId")
      .select("-passwordHash");
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return this.model
      .findOne({ email, isDeleted: false })
      .populate("roleId")
      .select("-passwordHash");
  }

  async updateUserProfile(
    userId: string,
    data: { fullName?: string; phone?: string; avatarUrl?: string }
  ): Promise<IUser | null> {
    return this.model
      .findByIdAndUpdate(userId, data, { new: true })
      .populate("roleId")
      .select("-passwordHash");
  }

  async verifyEmail(userId: string): Promise<IUser | null> {
    return this.model
      .findByIdAndUpdate(userId, { emailVerified: true }, { new: true })
      .populate("roleId")
      .select("-passwordHash");
  }

  async updateTrustLevel(
    userId: string,
    trustLevel: number
  ): Promise<IUser | null> {
    if (trustLevel < 0 || trustLevel > 100) {
      throw new AppError(MESSAGES.ERROR.USER.TRUST_LEVEL_INVALID, 400);
    }

    return this.model
      .findByIdAndUpdate(userId, { trustLevel }, { new: true })
      .populate("roleId")
      .select("-passwordHash");
  }

  /**
   * Get basic customer dashboard stats
   * - totalOrders: tổng số đơn hàng
   * - pendingOrders: đơn hàng đang ở trạng thái PendingPayment hoặc Paid (chưa Completed/Cancelled/Refunded)
   * - walletBalance: số dư ví hiện tại
   * - supportTickets: số ticket hỗ trợ đang mở
   */
  async getCustomerStats(userId: string): Promise<{
    totalOrders: number;
    pendingOrders: number;
    walletBalance: number;
    supportTickets: number;
  }> {
    const customerId = new mongoose.Types.ObjectId(userId);

    const [orders, wallet, activeTickets] = await Promise.all([
      Order.find({ customerUserId: customerId }).select("_id status").lean(),
      Wallet.findOne({ userId: customerId }).lean(),
      SupportTicket.countDocuments({
        customerUserId: customerId,
        status: { $in: ["Open", "InReview", "NeedMoreInfo"] },
      }),
    ]);

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o: any) =>
      ["PendingPayment", "Paid", "Processing"].includes(o.status)
    ).length;

    return {
      totalOrders,
      pendingOrders,
      walletBalance: wallet?.balance || 0,
      supportTickets: activeTickets,
    };
  }
}
