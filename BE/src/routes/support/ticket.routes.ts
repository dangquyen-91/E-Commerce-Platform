import { Router } from "express";
import { ticketController } from "@/controllers/support";
import { authenticate, checkPermission } from "@/middleware";
import { wrapRequestHandler } from "@/utils/handlers";
import { PERMISSIONS } from "@/constants/permissions";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Customer routes
router.post(
  "/",
  checkPermission(PERMISSIONS.TICKET_CREATE),
  wrapRequestHandler(ticketController.createTicket)
);

router.get(
  "/",
  checkPermission(PERMISSIONS.TICKET_VIEW),
  wrapRequestHandler(ticketController.getTickets)
);

router.get(
  "/stats",
  checkPermission(PERMISSIONS.TICKET_VIEW),
  wrapRequestHandler(ticketController.getTicketStats)
);

router.get(
  "/:id",
  checkPermission(PERMISSIONS.TICKET_VIEW),
  wrapRequestHandler(ticketController.getTicketById)
);

// Update ticket (customer can close, staff can do more)
router.patch(
  "/:id",
  checkPermission(PERMISSIONS.TICKET_UPDATE),
  wrapRequestHandler(ticketController.updateTicket)
);

// Staff routes
router.post(
  "/:id/assign",
  checkPermission(PERMISSIONS.TICKET_ASSIGN),
  wrapRequestHandler(ticketController.assignTicket)
);

router.post(
  "/:id/escalate",
  checkPermission(PERMISSIONS.TICKET_ESCALATE),
  wrapRequestHandler(ticketController.escalateTicket)
);

export default router;
