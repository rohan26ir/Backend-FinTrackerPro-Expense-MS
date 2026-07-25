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

  // Default Superadmin elevation
  if (user.email && user.email.toLowerCase() === "rohan26ir@gmail.com") {
    user.role = "admin";
    user.plan = "premium";
  }

  // Persist hashed refresh token
  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  // Build full user object (excluding sensitive fields)
  const userObj = user.toObject ? user.toObject() : user._doc;
  delete userObj.password;
  delete userObj.refreshToken;
  delete userObj.resetOtp;
  delete userObj.resetOtpExpiry;

  res.status(statusCode).json({
    success: true,
    accessToken,
    refreshToken,
    user: userObj,
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

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password +refreshToken +twoFactorSecret");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "Account is deactivated" });
    }

    // Check if 2FA is enabled on this user account
    if (user.isTwoFactorEnabled) {
      const tempToken = jwt.sign({ id: user._id, is2FATemp: true }, process.env.JWT_ACCESS_SECRET, { expiresIn: "5m" });
      return res.json({
        success: true,
        require2FA: true,
        twoFactorTempToken: tempToken,
        message: "2FA authentication code required. Please enter your 6-digit TOTP code.",
      });
    }

    await sendTokens(res, user);
  } catch (err) {
    next(err);
  }
};

// ─── TOTP Helper Functions (RFC 6238 Google Authenticator Verification) ───────
const base32Decode = (base32Str) => {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const cleaned = (base32Str || "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  for (let i = 0; i < cleaned.length; i++) {
    const val = alphabet.indexOf(cleaned.charAt(i));
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  return Buffer.from(bytes);
};

const generateTOTP = (secretBase32, timeStep) => {
  try {
    const key = base32Decode(secretBase32);
    if (key.length === 0) return null;

    const buffer = Buffer.alloc(8);
    let temp = timeStep;
    for (let i = 7; i >= 0; i--) {
      buffer[i] = temp & 0xff;
      temp = Math.floor(temp / 256);
    }

    const hmac = crypto.createHmac("sha1", key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const codeNumber =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return (codeNumber % 1000000).toString().padStart(6, "0");
  } catch {
    return null;
  }
};

const verifyTOTPCode = (secretBase32, userCode) => {
  if (!secretBase32 || !userCode) return false;
  const cleanCode = String(userCode).trim();
  if (cleanCode.length !== 6) return false;

  const currentStep = Math.floor(Date.now() / 1000 / 30);
  // Check -1 (past 30s), 0 (current step), +1 (next 30s)
  for (let window = -1; window <= 1; window++) {
    const generated = generateTOTP(secretBase32, currentStep + window);
    if (generated && generated === cleanCode) {
      return true;
    }
  }
  return false;
};

/**
 * POST /api/auth/login/2fa-verify
 * Verifies 6-digit TOTP code during 2FA login
 */
exports.verify2FAAndLogin = async (req, res, next) => {
  try {
    const { twoFactorTempToken, totpCode } = req.body;

    if (!twoFactorTempToken || !totpCode) {
      return res.status(400).json({ success: false, message: "Temp token and 6-digit 2FA code are required." });
    }

    let decoded;
    try {
      decoded = jwt.verify(twoFactorTempToken, process.env.JWT_ACCESS_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "2FA session expired. Please log in again." });
    }

    if (!decoded.is2FATemp || !decoded.id) {
      return res.status(401).json({ success: false, message: "Invalid 2FA token." });
    }

    const user = await User.findById(decoded.id).select("+twoFactorSecret");
    if (!user || !user.isTwoFactorEnabled) {
      return res.status(400).json({ success: false, message: "User not found or 2FA is not enabled." });
    }

    // Verify 6-digit TOTP code against user's 2FA secret
    const isValid = verifyTOTPCode(user.twoFactorSecret, totpCode);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid 2FA code. Please enter the live 6-digit code from Google Authenticator.",
      });
    }

    await sendTokens(res, user);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/2fa/enable (protected)
 */
exports.enable2FA = async (req, res, next) => {
  try {
    const { secret, totpCode } = req.body;
    if (!secret || !totpCode || String(totpCode).trim().length !== 6) {
      return res.status(400).json({ success: false, message: "Please provide secret and valid 6-digit code." });
    }

    // Verify TOTP code before enabling 2FA
    const isValid = verifyTOTPCode(secret, totpCode);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid 6-digit authenticator code. Scan the QR code with Google Authenticator and enter the live code.",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { isTwoFactorEnabled: true, twoFactorSecret: secret },
      { new: true }
    ).select("-password -refreshToken").lean();

    res.json({
      success: true,
      message: "Two-Factor Authentication (2FA) enabled successfully!",
      user: { ...updatedUser, id: updatedUser._id.toString() },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/2fa/disable (protected)
 */
exports.disable2FA = async (req, res, next) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { isTwoFactorEnabled: false, twoFactorSecret: "" },
      { new: true }
    ).select("-password -refreshToken").lean();

    res.json({
      success: true,
      message: "Two-Factor Authentication (2FA) disabled.",
      user: { ...updatedUser, id: updatedUser._id.toString() },
    });
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
 * POST /api/auth/change-password (protected)
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Please provide current and new password." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }

    const user = await User.findById(userId).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save({ validateModifiedOnly: true });

    res.json({ success: true, message: "Password updated successfully!" });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me  (protected)
 */
exports.getMe = async (req, res, next) => {
  try {
    const freshUser = await User.findById(req.user._id).select("-password -refreshToken").lean();
    if (!freshUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (freshUser.email && freshUser.email.toLowerCase() === "rohan26ir@gmail.com") {
      freshUser.role = "admin";
      freshUser.plan = "premium";
    }

    res.json({
      success: true,
      user: {
        ...freshUser,
        id: freshUser._id.toString(),
      },
    });
  } catch (err) {
    next(err);
  }
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
    const otp = crypto.randomInt(100000, 999999).toString();
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
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e5e7eb;border-radius:16px;background-color:#ffffff">
            <h2 style="color:#4F46E5;margin-top:0">Password Reset Request</h2>
            <p style="font-size:14px;color:#374151">Your one-time password (OTP) is:</p>
            <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#4F46E5;padding:16px;background:#F5F3FF;border-radius:12px;text-align:center;margin:16px 0">${otp}</div>
            <p style="color:#6B7280;font-size:13px">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
            <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6B7280">
              <p style="margin:0;font-weight:600">Developed by <a href="https://meetrohan.netlify.app/" target="_blank" style="color:#4F46E5;text-decoration:underline;font-weight:700">Rohan</a></p>
            </div>
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
