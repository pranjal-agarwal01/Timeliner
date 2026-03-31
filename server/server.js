require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const compression = require("compression");

const authRoutes = require("./routes/auth");
const questionRoutes = require("./routes/questions");

const app = express();

// Trust Render's reverse proxy so express-rate-limit reads real client IPs
// (without this, everyone shares one IP and the limiter fires for all users)
app.set("trust proxy", 1);

// ─── Middleware ───────────────────────────────────────────────────────────────
// Compress all responses with gzip — reduces JSON payload sizes ~60-80%
app.use(compression());
app.use(express.json());
app.use(cookieParser());

// Build allowed origins list from comma-separated CLIENT_ORIGIN env var
// e.g. CLIENT_ORIGIN=https://timeliner.vercel.app,https://timeliner-git-main.vercel.app
const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow no-origin requests (Postman, curl, Chrome extension)
            if (!origin) return callback(null, true);
            if (
                allowedOrigins.includes(origin) ||
                origin.startsWith("chrome-extension://")
            ) {
                return callback(null, true);
            }
            callback(new Error(`CORS: origin ${origin} not allowed`));
        },
        credentials: true,
    })
);

// ─── Rate Limiters ───────────────────────────────────────────────────────────
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
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again later" },
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/questions", questionRoutes);

// Health check — used by Render to verify the service is up
// Also useful as a keep-alive ping target from external cron
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
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error("❌ MongoDB connection error:", err.message);
        process.exit(1);
    });
