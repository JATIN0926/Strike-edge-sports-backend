import express from "express";
import { getMe, updateProfile, addAddress , deleteAddress, setDefaultAddress, updateAddress } from "../controllers/user.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.post("/address", protect, addAddress);
router.delete("/address/:addressId", protect, deleteAddress);
router.put("/address/:addressId", protect, updateAddress);
router.patch("/address/:addressId/default", protect, setDefaultAddress);


export default router;
