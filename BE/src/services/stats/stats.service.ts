import { Product, Shop, Order } from "@/models";

export interface StatsData {
  totalProducts: number;
  totalTransactions: number;
  totalSellers: number;
}

export class StatsService {
  async getStats(): Promise<StatsData> {
    // Count total approved products
    const totalProducts = await Product.countDocuments({
      isDeleted: false,
      status: "Approved",
    });

    // Count total completed orders (transactions)
    const totalTransactions = await Order.countDocuments({
      status: { $in: ["Paid", "Completed"] },
    });

    // Count total active shops (sellers)
    const totalSellers = await Shop.countDocuments({
      isDeleted: false,
      status: "Active",
    });

    return {
      totalProducts,
      totalTransactions,
      totalSellers,
    };
  }
}
