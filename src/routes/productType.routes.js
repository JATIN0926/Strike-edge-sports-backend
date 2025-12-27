import express from "express";
import {
  createProductType,
  getAllProductTypes,
  updateProductType,
  deleteProductType,
} from "../controllers/productType.controller.js";
import { isAdmin, protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, isAdmin, createProductType);
router.get("/", getAllProductTypes);
router.put("/:id", protect, isAdmin, updateProductType);
router.delete("/:id", protect, isAdmin, deleteProductType);

export default router;