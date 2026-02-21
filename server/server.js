require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const questionRoutes = require("./routes/questions");

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(cookieParser());
app.use(
    cors({
        origin: function (origin, callback) {
            const allowed = process.env.CLIENT_ORIGIN || "http://localhost:5173";
            // Allow: client origin, chrome extensions, and no-origin (e.g. Postman)
            if (!origin || origin === allowed || origin.startsWith("chrome-extension://")) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);

// Global rate limiter
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

// Stricter limiter for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: "Too many requests, please try again later" },
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/questions", questionRoutes);

// Health check
app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ message: "Internal server error" });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("✅ MongoDB connected");
        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    });
