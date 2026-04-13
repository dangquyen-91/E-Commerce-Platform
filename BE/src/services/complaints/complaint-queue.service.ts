import mongoose from "mongoose";
import { ComplaintQueue, SupportTicket, User } from "@/models";
import type { IComplaintQueue } from "@/models";
import { COMPLAINT_CONFIG } from "@/types";
import type { GetQueueQuery } from "@/validators/complaints/complaint.schema";

export class ComplaintQueueService {
  /**
   * Calculate priority score for a ticket
   */
  calculatePriorityScore(
    orderValue: number,
    buyerTrustLevel: number,
    sellerTrustLevel: number,
    ticketAgeHours: number,
    isHighValue: boolean,
    isEscalated: boolean
  ): number {
    const weights = COMPLAINT_CONFIG.PRIORITY_WEIGHTS;
    const highValueThreshold = COMPLAINT_CONFIG.HIGH_VALUE_THRESHOLD;

    const orderValueScore = Math.min(orderValue / highValueThreshold, 1);
    const buyerTrustScore = buyerTrustLevel / 100;
    const sellerTrustScore = (100 - sellerTrustLevel) / 100;
    const ticketAgeScore = Math.min(ticketAgeHours / 72, 1);
    const highValueBonus = isHighValue ? 1 : 0;

    let priority =
      orderValueScore * weights.orderValue +
      buyerTrustScore * weights.buyerTrust +
      sellerTrustScore * weights.sellerTrust +
      ticketAgeScore * weights.ticketAge +
      highValueBonus * weights.isHighValue;

    // Escalated tickets get additional priority
    if (isEscalated) {
      priority *= 1.2;
    }

    return Math.round(Math.min(priority * 100, 100));
  }

  /**
   * Get complaint queue with filters
   */
  async getQueue(
    query: GetQueueQuery
  ): Promise<{ items: IComplaintQueue[]; total: number }> {
    const filter: any = {};

    if (query.status) filter.status = query.status;
    if (query.isHighValue) filter.isHighValue = true;
    if (query.assignedModeratorId) {
      filter.assignedModeratorId = new mongoose.Types.ObjectId(
        query.assignedModeratorId
      );
    }

    const sortObj: any = {};
    sortObj[query.sortBy] = query.sortOrder === "asc" ? 1 : -1;

    const [items, total] = await Promise.all([
      ComplaintQueue.find(filter)
        .populate({
          path: "ticketId",
          populate: [
            { path: "customerUserId", select: "fullName email" },
            { path: "sellerUserId", select: "fullName email" },
            {
              path: "orderItemId",
              populate: [{ path: "productId", select: "title thumbnail" }],
            },
          ],
        })
        .populate("assignedModeratorId", "fullName email")
        .sort(sortObj)
        .limit(query.limit)
        .skip(query.skip),
      ComplaintQueue.countDocuments(filter),
    ]);

    return { items, total };
  }

  /**
   * Get next complaint from queue (auto-assign to moderator)
   */
  async pickNextFromQueue(
    moderatorId: string
  ): Promise<IComplaintQueue | null> {
    // Get the highest priority unassigned ticket
    const queueItem = await ComplaintQueue.findOneAndUpdate(
      { status: "InQueue", assignedModeratorId: null },
      {
        status: "Assigned",
        assignedModeratorId: new mongoose.Types.ObjectId(moderatorId),
        pickedUpAt: new Date(),
      },
      {
        sort: { queuePriority: -1, addedToQueueAt: 1 },
        new: true,
      }
    ).populate({
      path: "ticketId",
      populate: [
        { path: "customerUserId", select: "fullName email" },
        { path: "sellerUserId", select: "fullName email" },
      ],
    });

    if (queueItem) {
      // Update the ticket status
      await SupportTicket.findByIdAndUpdate(queueItem.ticketId, {
        status: "ModeratorAssigned",
        assignedToUserId: new mongoose.Types.ObjectId(moderatorId),
        firstResponseAt: new Date(),
      });
    }

    return queueItem;
  }

  /**
   * Pick multiple complaints from queue (auto-assign to moderator)
   */
  async pickMultipleFromQueue(
    moderatorId: string,
    count: number = 5
  ): Promise<IComplaintQueue[]> {
    const maxCount = Math.min(count, 10); // Limit max to 10 at once
    const pickedItems: IComplaintQueue[] = [];

    for (let i = 0; i < maxCount; i++) {
      const queueItem = await ComplaintQueue.findOneAndUpdate(
        { status: "InQueue", assignedModeratorId: null },
        {
          status: "Assigned",
          assignedModeratorId: new mongoose.Types.ObjectId(moderatorId),
          pickedUpAt: new Date(),
        },
        {
          sort: { queuePriority: -1, addedToQueueAt: 1 },
          new: true,
        }
      ).populate({
        path: "ticketId",
        populate: [
          { path: "customerUserId", select: "fullName email" },
          { path: "sellerUserId", select: "fullName email" },
        ],
      });

      if (!queueItem) {
        break; // No more items in queue
      }

      // Update the ticket status
      await SupportTicket.findByIdAndUpdate(queueItem.ticketId, {
        status: "ModeratorAssigned",
        assignedToUserId: new mongoose.Types.ObjectId(moderatorId),
        firstResponseAt: new Date(),
      });

      pickedItems.push(queueItem);
    }

    return pickedItems;
  }

  /**
   * Get moderator workload stats
   */
  async getModeratorWorkload(): Promise<
    Array<{
      moderatorId: string;
      moderatorName: string;
      assignedCount: number;
      inProgressCount: number;
      completedTodayCount: number;
    }>
  > {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const moderators = await User.find({
      roleId: { $exists: true },
    }).populate("roleId");

    // Filter moderators
    const moderatorUsers = moderators.filter(
      (u) => (u.roleId as any)?.roleKey === "MODERATOR"
    );

    const workloadStats = await Promise.all(
      moderatorUsers.map(async (mod) => {
        const [assignedCount, inProgressCount, completedTodayCount] =
          await Promise.all([
            ComplaintQueue.countDocuments({
              assignedModeratorId: mod._id,
              status: { $in: ["Assigned", "InProgress"] },
            }),
            ComplaintQueue.countDocuments({
              assignedModeratorId: mod._id,
              status: "InProgress",
            }),
            ComplaintQueue.countDocuments({
              assignedModeratorId: mod._id,
              status: "Completed",
              completedAt: { $gte: today },
            }),
          ]);

        return {
          moderatorId: mod._id.toString(),
          moderatorName: mod.fullName,
          assignedCount,
          inProgressCount,
          completedTodayCount,
        };
      })
    );

    return workloadStats;
  }

  /**
   * Auto-assign to least busy moderator
   */
  async autoAssignToLeastBusy(ticketId: string): Promise<IComplaintQueue | null> {
    const workload = await this.getModeratorWorkload();

    if (workload.length === 0) {
      return null;
    }

    // Find moderator with least assigned tickets
    const leastBusy = workload.reduce((prev, curr) =>
      curr.assignedCount < prev.assignedCount ? curr : prev
    );

    const queueItem = await ComplaintQueue.findOneAndUpdate(
      { ticketId: new mongoose.Types.ObjectId(ticketId), status: "InQueue" },
      {
        status: "Assigned",
        assignedModeratorId: new mongoose.Types.ObjectId(leastBusy.moderatorId),
        pickedUpAt: new Date(),
      },
      { new: true }
    );

    if (queueItem) {
      await SupportTicket.findByIdAndUpdate(ticketId, {
        status: "ModeratorAssigned",
        assignedToUserId: new mongoose.Types.ObjectId(leastBusy.moderatorId),
        firstResponseAt: new Date(),
      });
    }

    return queueItem;
  }

  /**
   * Update queue priorities (run periodically)
   */
  async updateQueuePriorities(): Promise<number> {
    const queueItems = await ComplaintQueue.find({
      status: { $in: ["InQueue", "Assigned"] },
    });

    let updated = 0;

    for (const item of queueItems) {
      const ticket = await SupportTicket.findById(item.ticketId);
      if (!ticket) continue;

      const ticketAgeHours =
        (Date.now() - ticket.createdAt.getTime()) / (1000 * 60 * 60);

      const newPriority = this.calculatePriorityScore(
        item.orderValue,
        item.buyerTrustLevel,
        item.sellerTrustLevel,
        ticketAgeHours,
        item.isHighValue,
        item.isEscalated
      );

      if (newPriority !== item.queuePriority) {
        await ComplaintQueue.findByIdAndUpdate(item._id, {
          queuePriority: newPriority,
          ticketAge: ticketAgeHours,
        });
        updated++;
      }
    }

    return updated;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    totalInQueue: number;
    totalAssigned: number;
    totalInProgress: number;
    totalCompletedToday: number;
    avgWaitTimeMinutes: number;
    highValueCount: number;
  }> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalInQueue,
      totalAssigned,
      totalInProgress,
      totalCompletedToday,
      highValueCount,
    ] = await Promise.all([
      ComplaintQueue.countDocuments({ status: "InQueue" }),
      ComplaintQueue.countDocuments({ status: "Assigned" }),
      ComplaintQueue.countDocuments({ status: "InProgress" }),
      ComplaintQueue.countDocuments({
        status: "Completed",
        completedAt: { $gte: today },
      }),
      ComplaintQueue.countDocuments({ status: "InQueue", isHighValue: true }),
    ]);

    // Calculate average wait time for items still in queue
    const inQueueItems = await ComplaintQueue.find({ status: "InQueue" });
    const totalWaitTime = inQueueItems.reduce((sum, item) => {
      return sum + (Date.now() - item.addedToQueueAt.getTime());
    }, 0);
    const avgWaitTimeMinutes =
      inQueueItems.length > 0
        ? Math.round(totalWaitTime / inQueueItems.length / 60000)
        : 0;

    return {
      totalInQueue,
      totalAssigned,
      totalInProgress,
      totalCompletedToday,
      avgWaitTimeMinutes,
      highValueCount,
    };
  }
}

export const complaintQueueService = new ComplaintQueueService();
