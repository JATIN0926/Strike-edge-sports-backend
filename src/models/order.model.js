import mongoose from "mongoose";

/* ---------- Order Item (Snapshot) ---------- */
const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    image: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

/* ---------- Shipping Address (Snapshot) ---------- */
const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: "India",
    },
  },
  { _id: false }
);

/* ---------- Order Schema ---------- */
const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      required: true,
    },

    orderStatus: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"],
      default: "PLACED",
    },

    subtotal: Number,
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    totalAmount: Number,
    cancellationReason: {
      type: String,
      default: "",
    },

    cancelledBy: {
      type: String,
      enum: ["USER", "ADMIN"],
    },

    paymentInfo: {
      gateway: {
        type: String,
        enum: ["RAZORPAY"],
      },

      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpaySignature: String,

      status: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED"],
        default: "PENDING",
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Order", orderSchema);
