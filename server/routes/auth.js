const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const User = require("../models/User");
const generateOTP = require("../utils/generateOTP");
const sendEmail = require("../utils/sendEmail");

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

            // Check for existing user
            const existing = await User.findOne({ email });
            if (existing) {
                return res.status(409).json({ message: "Email already registered" });
            }

            // Hash password
            const passwordHash = await bcrypt.hash(password, 12);

            // Generate and hash OTP
            const otp = generateOTP();
            const otpHash = await bcrypt.hash(otp, 10);
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

            // Create user
            await User.create({
                email,
                passwordHash,
                otpHash,
                otpExpiresAt,
                otpLastSentAt: new Date(),
            });

            // Send OTP email
            await sendEmail(
                email,
                "Verify your DSA Tracker account",
                `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px;">
          <h2 style="color:#7c3aed;">DSA Revision Tracker</h2>
          <p>Your verification code is:</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#7c3aed;padding:16px 0;">${otp}</div>
          <p style="color:#888;">This code expires in 10 minutes.</p>
        </div>`
            );

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

            const isMatch = await bcrypt.compare(otp, user.otpHash);
            if (!isMatch) {
                return res.status(400).json({ message: "Invalid OTP" });
            }

            // Mark verified, clear OTP fields
            user.isVerified = true;
            user.otpHash = null;
            user.otpExpiresAt = null;
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

            // Generate new OTP
            const otp = generateOTP();
            const otpHash = await bcrypt.hash(otp, 10);

            user.otpHash = otpHash;
            user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
            user.otpLastSentAt = new Date();
            await user.save();

            await sendEmail(
                email,
                "Your new verification code — DSA Tracker",
                `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px;">
          <h2 style="color:#7c3aed;">DSA Revision Tracker</h2>
          <p>Your new verification code is:</p>
          <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#7c3aed;padding:16px 0;">${otp}</div>
          <p style="color:#888;">This code expires in 10 minutes.</p>
        </div>`
            );

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
