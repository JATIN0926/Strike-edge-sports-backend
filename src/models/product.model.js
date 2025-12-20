import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      // Example: "English Willow – Intermediate"
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    description: {
      type: String,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
    },

    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],

    stock: {
      type: Number,
      default: 0,
    },

    productType: {
      type: String,
      enum: ["bat", "ball", "gloves", "pads"],
      required: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      // English Willow / Kashmiri Willow
    },

    grade: {
      type: String,
      required: true,
      trim: true,
      // Novice / Intermediate / Elite / Grade A / Grade A+
    },

    attributes: [
      {
        key: {
          type: String,
          trim: true,
        },
        value: {
          type: String,
          trim: true,
        },
      },
    ],

    soldCount: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Prevent duplicate grade under same category
 * Example: English Willow – Elite added twice ❌
 */
productSchema.index({ category: 1, grade: 1 }, { unique: true });

export default mongoose.model("Product", productSchema);
