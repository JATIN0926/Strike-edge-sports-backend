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
    orderId: {
      type: String,
      unique: true,
    },
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
      enum: ["CASHFREE", "COD"],
      },
    
      cfOrderId: String,
      cfPaymentId: String,
      status: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED"],
        default: "PENDING",
      }
    }
    
  },
  {
    timestamps: true,
  }
);

orderSchema.pre("save", async function () {
  if (this.orderId) return;

  const date = new Date();

  const yyyy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  const dateCode = `${yyyy}${mm}${dd}`;

  // Count orders created today
  const count = await mongoose.model("Order").countDocuments({
    createdAt: {
      $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
    },
  });

  const sequence = String(count + 1).padStart(5, "0");

  this.orderId = `SE-${dateCode}-${sequence}`;
});

export default mongoose.model("Order", orderSchema);
