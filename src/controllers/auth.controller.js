import admin from "../config/firebaseAdmin.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const googleAuth = async (req, res) => {
  try {
    const { token, name, email, photoURL } = req.body;

    if (!token) {
      return res.status(400).json({ message: "Token missing" });
    }

    const decoded = await admin.auth().verifyIdToken(token);

    if (!decoded.email) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    let user = await User.findOne({ email });

    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      user = await User.create({
        name,
        email,
        photoURL,
        password: hashedPassword,
      });
    }

    const jwtToken = jwt.sign(
      { id: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const isProd = process.env.NODE_ENV === "production";

    res
      .cookie("token", jwtToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        domain: isProd ? ".strikedgesports.in" : undefined,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .status(200)
      .json({
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          photoURL: user.photoURL,
          isAdmin: user.isAdmin,
        },
      });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Google authentication failed" });
  }
};

export const logout = async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === "production";

    res
      .clearCookie("token", {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        domain: isProd ? ".strikedgesports.in" : undefined,
      })
      .status(200)
      .json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Logout failed" });
  }
};
