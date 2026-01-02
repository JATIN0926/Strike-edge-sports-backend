import express from "express";
import { cancelOrderByUser, createOrder, getAllOrders, getMyOrders, updateOrderStatus ,getOrderByCashfreeId} from "../controllers/order.controller.js";
import { protect, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/", protect, isAdmin, getAllOrders);
router.get("/my", protect, getMyOrders);
router.get("/by-cf/:id", protect, getOrderByCashfreeId);
router.put("/:id/status", protect, isAdmin, updateOrderStatus);
router.put("/:id/cancel", protect, cancelOrderByUser);


export default router;
