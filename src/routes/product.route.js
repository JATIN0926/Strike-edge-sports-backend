import express from "express";
import {
  addProduct,
  deleteCloudinaryImage,
  deleteProduct,
  getAllProducts,
  getProductById,
  updateProduct,
} from "../controllers/product.controller.js";
import { isAdmin, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, isAdmin, addProduct);
router.delete("/cloudinary", protect, isAdmin, deleteCloudinaryImage);
router.get("/", protect, isAdmin, getAllProducts);
router.delete("/:id", protect, isAdmin, deleteProduct);
router.get("/:id", protect, isAdmin, getProductById); 
router.put("/:id", protect, isAdmin, updateProduct);

export default router;
