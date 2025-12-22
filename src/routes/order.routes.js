import express from "express";
import { cancelOrderByUser, createOrder, getAllOrders, getMyOrders, updateOrderStatus } from "../controllers/order.controller.js";
import { protect, isAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/", protect, isAdmin, getAllOrders);
router.put("/:id/status", protect, isAdmin, updateOrderStatus);
router.get("/my", protect, getMyOrders);
router.put("/:id/cancel", protect, cancelOrderByUser);


export default router;
