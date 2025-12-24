import express from "express";
import {
  addProduct,
  deleteCloudinaryImage,
  deleteProduct,
  getAllProducts,
  getProductByIdPublic,
  getProductsByCategorySlug,
  getRelatedProducts,
  getSavedProducts,
  toggleSavedProduct,
  updateProduct,
} from "../controllers/product.controller.js";
import { isAdmin, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, isAdmin, addProduct);
router.delete("/cloudinary", protect, isAdmin, deleteCloudinaryImage);
router.get("/", getAllProducts);
router.get("/saved", protect, getSavedProducts);
router.get("/:id", getProductByIdPublic);
router.get("/:productId/related", getRelatedProducts);
router.delete("/:id", protect, isAdmin, deleteProduct);
router.get("/category/:slug", getProductsByCategorySlug);
router.put("/:id", protect, isAdmin, updateProduct);
router.post("/saved/:productId", protect, toggleSavedProduct);

export default router;
