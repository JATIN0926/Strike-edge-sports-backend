import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { cashfreeWebhook, createCashfreeOrder } from "../controllers/cashfree.controller.js";

const router = express.Router();

router.post("/create-order", protect, createCashfreeOrder);
router.post("/webhook", cashfreeWebhook);


export default router;
