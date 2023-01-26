import { Router } from "express";
import orderController from "../../controllers/order.controller";
import {
  requireIsAdmin,
  requireLogin,
} from "../../middlewares/auth.middleware";

const orderRouter = Router();

// orderRouter.get("/seed", groupProductController.seed);
orderRouter.get("/user", requireLogin, orderController.getOrdersUser);
orderRouter.get("/:id", requireIsAdmin, orderController.getOrderById);
orderRouter.get("/", requireIsAdmin, orderController.getAllOrders);
orderRouter.patch("/checkout", requireLogin, orderController.checkout);
orderRouter.patch("/:id/status", requireIsAdmin, orderController.updateStatus);

export default orderRouter;
