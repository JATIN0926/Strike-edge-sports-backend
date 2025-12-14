import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./src/config/db.js";
import cookieParser from "cookie-parser";
import authRoutes from "./src/routes/auth.routes.js";;
dotenv.config();

const app = express();

app.use(
cors({
origin: process.env.CLIENT_URL,
credentials: true,
// methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
// allowedHeaders: ["Content-Type", "Authorization"],
})
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

app.use(cookieParser());

app.get("/", (req, res) => {
res.send("Welcome to the Anjali Blogs API !!");
});

app.use("/api/auth", authRoutes);


const PORT = process.env.PORT || 5000;

connectDB()
.then(() => {
app.on("error", (error) => {
    console.log(error);
    throw error;
});

app.listen(PORT, () => {
    console.log(`Server is running at port: ${PORT}`);
});
})
.catch((err) => {
console.log("MongoDB connection failed:", err);
});
