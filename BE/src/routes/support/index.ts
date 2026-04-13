import { Router } from "express";
import conversationRoutes from "./conversation.routes";
import messageRoutes from "./message.routes";
import ticketRoutes from "./ticket.routes";

const router = Router();

router.use("/conversations", conversationRoutes);
router.use("/messages", messageRoutes);
router.use("/tickets", ticketRoutes);

export default router;
