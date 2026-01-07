import admin from "../config/firebaseAdmin.js";
import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export const googleAuth = async (req, res) => {
  try {
    let idToken = req.headers.authorization?.split(" ")[1];

    if (!idToken) idToken = req.body.token;

    if (!idToken) {
      return res.status(400).json({ message: "Google token missing" });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);

    if (!decoded?.email) {
      return res.status(401).json({ message: "Invalid Google token" });
    }

    const email = decoded.email;
    const name = decoded.name || req.body.name;
    const photoURL = decoded.picture || req.body.photoURL;

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
    console.error("Google Auth Error:", err);

    return res.status(500).json({ message: "Google authentication failed" });
  }
};

export const logout = async (req, res) => {
  try {
    const isProd = process.env.NODE_ENV === "production";

    res.clearCookie("token", {
      httpOnly: true,
      secure: isProd,
      sameSite: "none",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ message: "Logout failed" });
  }
};
