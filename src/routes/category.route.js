import express from "express";
import {
  createCategory,
  getAllCategories,
} from "../controllers/category.controller.js";
import { isAdmin, protect } from "../middleware/auth.middleware.js";
import { updateCategory } from "../controllers/category.controller.js";
import { deleteCategory } from "../controllers/category.controller.js";

const router = express.Router();

router.post("/", protect, isAdmin, createCategory);
router.get("/", getAllCategories);
router.put("/:id", protect, isAdmin, updateCategory);
router.delete("/:id", protect, isAdmin, deleteCategory);

export default router;
