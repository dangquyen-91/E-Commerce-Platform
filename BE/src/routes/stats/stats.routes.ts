import { Router } from "express";
import { StatsController } from "@/controllers/stats/stats.controller";
import { wrapRequestHandler } from "@/utils/handlers";

const router = Router();
const statsController = new StatsController();

// Public route - anyone can view stats
router.get("/", wrapRequestHandler(statsController.getStats));

export default router;
