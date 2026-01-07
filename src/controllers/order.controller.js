import { sendEmail } from "../config/sendEmail.js";
import { orderPlacedTemplate } from "../emailTemplates/orderPlaceTemplate.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";

/* ================= CREATE ORDER ================= */
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      subtotal,
      deliveryCharge,
      totalAmount,
    } = req.body;

    if (!items?.length) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address required" });
    }

    if (!paymentMethod) {
      return res.status(400).json({ message: "Payment method required" });
    }

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res
          .status(404)
          .json({ message: `Product not found: ${item.title}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for ${product.title}`,
        });
      }
    }

    const secureSubtotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    if (secureSubtotal !== subtotal) {
      return res.status(400).json({
        message: "Cart total mismatch. Please refresh page.",
      });
    }

    const secureTotal = secureSubtotal + deliveryCharge;

    const order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      paymentInfo: {
        gateway: "COD",
        status: "PENDING",
      },
      subtotal: secureSubtotal,
      deliveryCharge,
      totalAmount: secureTotal,
    });

    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: {
          stock: -item.quantity,
          soldCount: item.quantity,
        },
      });
    }

    const user = await User.findById(req.user._id);
    console.log("📧 Attempting to send email...");
    console.log("To:", user.email);
    console.log("From:", process.env.SENDGRID_FROM_EMAIL);

    Promise.race([
      sendEmail({
        to: user.email,
        subject: `Order Confirmed - Strike Edge Sports`,
        html: orderPlacedTemplate(user.name, order.orderId),
      }),
      new Promise(
        (_, reject) =>
          setTimeout(() => reject(new Error("Email timeout after 10s")), 10000) // ✅ 10s timeout
      ),
    ])
      .then((info) => {
        console.log("✅ Email sent successfully via SendGrid");
      })
      .catch((err) => {
        console.error("❌ EMAIL FAILED:", {
          error: err.message,
          user: user.email,
        });
      });

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ message: "Failed to create order" });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 6, search = "" } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    let query = {};

    if (search) {
      const regex = new RegExp(search, "i");

      query.$or = [{ orderId: regex }, { "shippingAddress.phone": regex }];
    }

    const orders = await Order.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Order.countDocuments(query);

    res.status(200).json({
      orders,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("GET ORDERS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    const allowedStatuses = [
      "PLACED",
      "CONFIRMED",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid order status" });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const previousStatus = order.orderStatus;

    if (previousStatus === "DELIVERED" && status === "CANCELLED") {
      return res.status(400).json({
        message: "Delivered orders cannot be cancelled",
      });
    }

    /* 🔁 ROLLBACK STOCK IF CANCELLED */
    if (status === "CANCELLED" && previousStatus !== "CANCELLED") {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: {
            stock: item.quantity,
            soldCount: -item.quantity,
          },
        });
      }

      order.cancelledBy = "ADMIN";
    }

    order.orderStatus = status;
    await order.save();

    res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (err) {
    console.error("UPDATE ORDER STATUS ERROR:", err);
    res.status(500).json({ message: "Failed to update order status" });
  }
};
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const cancelOrderByUser = async (req, res) => {
  try {
    const { reason } = req.body;
    const { id } = req.params;

    const order = await Order.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (["DELIVERED", "CANCELLED"].includes(order.orderStatus)) {
      return res.status(400).json({
        message: "Order cannot be cancelled at this stage",
      });
    }

    // rollback stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: {
          stock: item.quantity,
          soldCount: -item.quantity,
        },
      });
    }

    order.orderStatus = "CANCELLED";
    order.cancellationReason = reason || "";
    order.cancelledBy = "USER";

    await order.save();

    res.status(200).json({
      message: "Order cancelled successfully",
      order,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to cancel order" });
  }
};

export const getOrderByCashfreeId = async (req, res) => {
  console.log("\n==============================");
  console.log("🔥 HIT: GET ORDER BY CASHFREE ID");
  console.log("📩 Time:", new Date().toISOString());

  try {
    const cfOrderId = req.params.id;

    console.log("👉 Incoming CF Order ID:", cfOrderId);
    console.log("👉 Cookies:", req.cookies);
    console.log("👉 Logged-in User:", req.user?._id || null);

    if (!cfOrderId) {
      console.log("❌ Missing Cashfree Order ID");
      return res.status(400).json({
        success: false,
        message: "Cashfree order id is required",
      });
    }

    console.log("🔍 Searching DB for order…");

    const order = await Order.findOne({
      "paymentInfo.cfOrderId": cfOrderId,
    }).select("-paymentInfo");

    if (!order) {
      console.log("⏳ Order NOT FOUND YET — webhook may still be processing");
      return res.status(200).json({
        success: true,
        order: null,
      });
    }

    console.log("✅ ORDER FOUND IN DB");
    console.log("🧾 Order ID:", order._id.toString());
    console.log("👤 Order User:", order.user?.toString());
    console.log("💳 Status:", order.paymentStatus);
    console.log("💰 Total:", order.totalAmount);

    // If user exists, verify ownership
    if (req.user) {
      console.log("🔐 Checking authorization…");

      if (
        order.user.toString() !== req.user._id.toString() &&
        !req.user.isAdmin
      ) {
        console.log("🚫 AUTH FAILED — User not allowed");
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this order",
        });
      }

      console.log("✔ AUTH OK — User allowed");
    } else {
      console.log("⚠ No logged-in user. Allowing access (status polling).");
    }

    console.log("📤 Sending order to client…");
    return res.status(200).json({
      success: true,
      order,
    });
  } catch (err) {
    console.log("🔥🔥🔥 ERROR IN GET ORDER BY CF ID 🔥🔥🔥");
    console.error(err);

    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  } finally {
    console.log("==============================\n");
  }
};
