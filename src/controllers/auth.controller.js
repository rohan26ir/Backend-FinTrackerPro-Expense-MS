const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");

// ─── Helpers ─────────────────────────────────────────────────────────────────
const signAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });

const sendTokens = async (res, user, statusCode = 200) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  // Persist hashed refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      currency: user.currency,
    },
  });
};

const createTransport = () =>
  nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({ name, email, password });
    await sendTokens(res, user, 201);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password +refreshToken");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    await sendTokens(res, user);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 */
exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.id).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: "Refresh token mismatch" });
    }

    const accessToken = signAccessToken(user._id);
    res.json({ success: true, accessToken });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: "" });
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me  (protected)
 */
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

/**
 * POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always respond 200 to avoid user enumeration
    if (!user) {
      return res.json({ success: true, message: "If that email exists, an OTP has been sent" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetOtp = otp;
    user.resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min
    await user.save({ validateBeforeSave: false });

    try {
      const transport = createTransport();
      await transport.sendMail({
        from: process.env.EMAIL_FROM || "FinTracker <noreply@fintracker.com>",
        to: user.email,
        subject: "FinTracker — Password Reset OTP",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px">
            <h2 style="color:#4F46E5">Password Reset</h2>
            <p>Your one-time password is:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#4F46E5;padding:16px;background:#F5F3FF;border-radius:8px;text-align:center">${otp}</div>
            <p style="color:#6B7280;font-size:13px">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("Email send failed:", mailErr.message);
      // Reset OTP so user can retry
      user.resetOtp = undefined;
      user.resetOtpExpiry = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({ success: false, message: "Failed to send OTP email" });
    }

    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select("+resetOtp +resetOtpExpiry");
    if (!user || !user.resetOtp || !user.resetOtpExpiry) {
      return res.status(400).json({ success: false, message: "No active reset request" });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    if (user.resetOtpExpiry < new Date()) {
      return res.status(400).json({ success: false, message: "OTP has expired" });
    }

    user.password = newPassword;
    user.resetOtp = undefined;
    user.resetOtpExpiry = undefined;
    user.refreshToken = "";
    await user.save();

    res.json({ success: true, message: "Password reset successful. Please log in." });
  } catch (err) {
    next(err);
  }
};
