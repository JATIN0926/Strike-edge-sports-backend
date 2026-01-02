import axios from "axios";
import Product from "../models/product.model.js";
import crypto from "crypto";
import Order from "../models/order.model.js";
import User from "../models/user.model.js";
import { sendEmail } from "../config/sendEmail.js";
import { orderPlacedTemplate } from "../emailTemplates/orderPlaceTemplate.js";

/* ---------------------- CREATE CF ORDER ---------------------- */
export const createCashfreeOrder = async (req, res) => {
  try {
    const { items, shippingAddress, totalAmount } = req.body;

    if (!items?.length) {
      return res.status(400).json({ message: "Cart empty" });
    }

    // validate stock
    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product || product.stock < item.quantity) {
        return res.status(400).json({ message: `Out of stock: ${item.title}` });
      }
    }

    const secureSubtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (secureSubtotal !== totalAmount) {
      return res.status(400).json({
        message: "Cart total mismatch. Please refresh page.",
      });
    }

    // 1️⃣ CREATE TEMP ORDER IN DB
    const tempOrder = await Order.create({
      user: req.user._id,
      items,
      shippingAddress,
      paymentMethod: "ONLINE",

      subtotal: secureSubtotal,
      deliveryCharge: 0,
      totalAmount : secureSubtotal,

      orderStatus: "PLACED",

      paymentInfo: {
        gateway: "CASHFREE",
        status: "PENDING",
      },
    });

    const cfOrderRef = "SE-" + Date.now();

    const payload = {
      order_id: cfOrderRef,
      order_amount: totalAmount,
      order_currency: "INR",

      customer_details: {
        customer_id: req.user._id.toString(),
        customer_name: req.user.name,
        customer_email: req.user.email,
        customer_phone: shippingAddress.phone,
      },

      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/payment/status?order_id={order_id}`,
        notify_url: `${process.env.BACKEND_URL}/api/payments/cashfree/webhook`,
      },

      order_tags: {
        dbOrderId: tempOrder._id.toString(),
        userId: req.user._id.toString(),
      },
    };

    const response = await axios.post(
      "https://sandbox.cashfree.com/pg/orders",
      payload,
      {
        headers: {
          "x-client-id": process.env.CF_APP_ID,
          "x-client-secret": process.env.CF_SECRET_KEY,
          "x-api-version": "2022-09-01",
          "Content-Type": "application/json",
        },
      }
    );

    return res.json({
      cfOrderId: cfOrderRef,
      payment_session_id: response.data.payment_session_id,
    });
  } catch (err) {
    console.log(err.response?.data || err);
    return res.status(500).json({ message: "Payment init failed" });
  }
};

export const cashfreeWebhook = async (req, res) => {
  console.log("🔥 WEBHOOK HIT");

  try {
    const signature = req.headers["x-webhook-signature"];
    const timestamp = req.headers["x-webhook-timestamp"];

    const rawBody = req.body.toString();

    // VERIFY SIGNATURE
    const expected = crypto
      .createHmac("sha256", process.env.CF_SECRET_KEY)
      .update(timestamp + rawBody)
      .digest("base64");

    if (signature !== expected) {
      console.log("❌ Signature mismatch");
      return res.status(400).send("Invalid signature");
    }

    console.log("✅ Signature verified");

    const event = JSON.parse(rawBody);

    // ONLY PROCESS SUCCESS
    if (
      event.type !== "PAYMENT_SUCCESS_WEBHOOK" &&
      event.type !== "PAYMENT.SUCCESS"
    ) {
      console.log("Ignoring event:", event.type);
      return res.sendStatus(200);
    }

    const cfOrderId = event.data?.order?.order_id;
    const paymentId = event.data?.payment?.cf_payment_id;

    const dbOrderId = event.data?.order?.order_tags?.dbOrderId;
    const userId = event.data?.order?.order_tags?.userId;

    if (!dbOrderId || !userId || !cfOrderId || !paymentId) {
      console.log("❌ Missing critical tags");
      return res.sendStatus(200);
    }

    // FIND TEMP ORDER
    const order = await Order.findById(dbOrderId);

    if (!order) {
      console.log("❌ Order not found in DB");
      return res.sendStatus(200);
    }

    // IDEMPOTENCY
    if (order.paymentInfo?.status === "PAID") {
      console.log("♻️ Already marked paid — skipping");
      return res.sendStatus(200);
    }

    // REDUCE STOCK
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity, soldCount: item.quantity },
      });
    }

    // UPDATE ORDER
    order.paymentInfo = {
      gateway: "CASHFREE",
      cfOrderId,
      cfPaymentId: paymentId,
      status: "PAID",
    };

    order.orderStatus = "PLACED";

    await order.save();

    console.log("🎉 ORDER CONFIRMED:", order.orderId);

    // SEND EMAIL
    const user = await User.findById(order.user);

    if (user?.email) {
      sendEmail({
        to: user.email,
        subject: `Order Confirmed - Strike Edge Sports`,
        html: orderPlacedTemplate(user.name, order.orderId),
      }).catch(() => console.log("⚠️ email failed"));
    }

    return res.sendStatus(200);
  } catch (err) {
    console.log("❌ WEBHOOK ERROR", err);
    return res.sendStatus(200);
  }
};
