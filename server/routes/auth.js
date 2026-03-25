const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const User = require("../models/User");
const generateOTP = require("../utils/generateOTP");
const sendEmail = require("../utils/sendEmail");

// ─── HMAC OTP Helpers ─────────────────────────────────────────────────────────
// Use HMAC-SHA256 instead of bcrypt for short-lived OTPs.
// bcrypt adds 100ms+ per hash/compare; HMAC is <1ms and still cryptographically secure.

function hashOTP(otp) {
    return crypto
        .createHmac("sha256", process.env.JWT_SECRET)
        .update(otp)
        .digest("hex");
}

function verifyOTPHash(otp, hash) {
    const expected = hashOTP(otp);
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash));
}

// ─── Register ────────────────────────────────────────────────────────────────
router.post(
    "/register",
    [
        body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
        body("password")
            .isLength({ min: 6 })
            .withMessage("Password must be at least 6 characters"),
    ],
    validate,
    async (req, res) => {
        try {
            const { email, password } = req.body;

            // Check for existing verified user
            const existing = await User.findOne({ email });
            if (existing) {
                if (existing.isVerified) {
                    return res.status(409).json({ message: "Email already registered" });
                }
                // Unverified user exists — delete and let them re-register cleanly
                await User.deleteOne({ email });
            }

            // Generate OTP
            const otp = generateOTP();
            const otpHash = hashOTP(otp);
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

            // Send email FIRST — if this fails, no user is created (fixes race condition)
            try {
                await sendEmail(
                    email,
                    "Verify your Timeliner account",
                    `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px;">
          <h2 style="color:#7c3aed;">Timeliner</h2>
          <p>Your verification code is:</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#7c3aed;padding:16px 0;">${otp}</div>
          <p style="color:#888;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>`
                );
            } catch (emailErr) {
                console.error("SMTP error during register:", emailErr.message);
                return res.status(503).json({ message: "Could not send verification email. Please try again." });
            }

            // Hash password and create user only after email succeeds
            const passwordHash = await bcrypt.hash(password, 12);
            await User.create({
                email,
                passwordHash,
                otpHash,
                otpExpiresAt,
                otpLastSentAt: new Date(),
                otpAttempts: 0,
            });

            res.status(201).json({ message: "OTP sent to your email" });
        } catch (err) {
            console.error("Register error:", err);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ─── Verify OTP ──────────────────────────────────────────────────────────────
router.post(
    "/verify-otp",
    [
        body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
        body("otp")
            .isLength({ min: 6, max: 6 })
            .isNumeric()
            .withMessage("OTP must be 6 digits"),
    ],
    validate,
    async (req, res) => {
        try {
            const { email, otp } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            if (user.isVerified) {
                return res.status(400).json({ message: "Email already verified" });
            }
            if (!user.otpHash || !user.otpExpiresAt) {
                return res.status(400).json({ message: "No OTP pending. Request a new one." });
            }
            if (new Date() > user.otpExpiresAt) {
                return res.status(400).json({ message: "OTP expired. Request a new one." });
            }

            // Brute-force protection — max 5 attempts
            if (user.otpAttempts >= 5) {
                return res.status(429).json({ message: "Too many attempts. Please request a new OTP." });
            }

            const isMatch = verifyOTPHash(otp, user.otpHash);
            if (!isMatch) {
                user.otpAttempts = (user.otpAttempts || 0) + 1;
                await user.save();
                const remaining = 5 - user.otpAttempts;
                return res.status(400).json({
                    message: remaining > 0
                        ? `Invalid OTP. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
                        : "Too many attempts. Please request a new OTP.",
                });
            }

            // Mark verified, clear all OTP fields
            user.isVerified = true;
            user.otpHash = null;
            user.otpExpiresAt = null;
            user.otpLastSentAt = null;
            user.otpAttempts = 0;
            await user.save();

            res.json({ message: "Email verified successfully" });
        } catch (err) {
            console.error("Verify OTP error:", err);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ─── Login ───────────────────────────────────────────────────────────────────
router.post(
    "/login",
    [
        body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
        body("password").notEmpty().withMessage("Password required"),
    ],
    validate,
    async (req, res) => {
        try {
            const { email, password } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: "Invalid credentials" });
            }
            if (!user.isVerified) {
                return res
                    .status(403)
                    .json({ message: "Please verify your email first" });
            }

            const isMatch = await bcrypt.compare(password, user.passwordHash);
            if (!isMatch) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            // Issue JWT
            const token = jwt.sign(
                { userId: user._id },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
            );

            // Set httpOnly cookie
            res.cookie("token", token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });

            res.json({ message: "Logged in", token });
        } catch (err) {
            console.error("Login error:", err);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ─── Resend OTP ──────────────────────────────────────────────────────────────
router.post(
    "/resend-otp",
    [body("email").isEmail().normalizeEmail().withMessage("Valid email required")],
    validate,
    async (req, res) => {
        try {
            const { email } = req.body;

            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }
            if (user.isVerified) {
                return res.status(400).json({ message: "Email already verified" });
            }

            // Rate limit: 1 per minute
            if (
                user.otpLastSentAt &&
                Date.now() - user.otpLastSentAt.getTime() < 60 * 1000
            ) {
                return res
                    .status(429)
                    .json({ message: "Please wait 1 minute before requesting again" });
            }

            // Generate new OTP using HMAC (fast, <1ms)
            const otp = generateOTP();
            const otpHash = hashOTP(otp);

            // Send email BEFORE updating DB
            try {
                await sendEmail(
                    email,
                    "Your new verification code — Timeliner",
                    `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px;">
          <h2 style="color:#7c3aed;">Timeliner</h2>
          <p>Your new verification code is:</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#7c3aed;padding:16px 0;">${otp}</div>
          <p style="color:#888;">This code expires in 10 minutes. Do not share it with anyone.</p>
        </div>`
                );
            } catch (emailErr) {
                console.error("SMTP error during resend:", emailErr.message);
                return res.status(503).json({ message: "Could not send email. Please try again." });
            }

            user.otpHash = otpHash;
            user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
            user.otpLastSentAt = new Date();
            user.otpAttempts = 0; // Reset attempt counter on resend
            await user.save();

            res.json({ message: "OTP resent" });
        } catch (err) {
            console.error("Resend OTP error:", err);
            res.status(500).json({ message: "Server error" });
        }
    }
);

// ─── Logout ──────────────────────────────────────────────────────────────────
router.post("/logout", (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.json({ message: "Logged out" });
});

module.exports = router;
