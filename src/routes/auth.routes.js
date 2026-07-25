const { Router } = require("express");
const { body, query } = require("express-validator");
const ctrl = require("../controllers/auth.controller");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = Router();

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 100 }).withMessage("Name too long"),
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  validate,
  ctrl.register
);

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  ctrl.login
);

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post(
  "/refresh",
  [body("refreshToken").notEmpty().withMessage("Refresh token is required")],
  validate,
  ctrl.refresh
);

// ── POST /api/auth/logout  (protected) ───────────────────────────────────────
router.post("/logout", protect, ctrl.logout);

// ── GET /api/auth/me  (protected) ────────────────────────────────────────────
router.get("/me", protect, ctrl.getMe);

// ── POST /api/auth/change-password  (protected) ─────────────────────────────
router.post("/change-password", protect, ctrl.changePassword);

// ── 2FA Routes ───────────────────────────────────────────────────────────────
router.post("/login/2fa-verify", ctrl.verify2FAAndLogin);
router.post("/2fa/enable", protect, ctrl.enable2FA);
router.post("/2fa/disable", protect, ctrl.disable2FA);

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Valid email required").normalizeEmail()],
  validate,
  ctrl.forgotPassword
);

// ── POST /api/auth/reset-password ────────────────────────────────────────────
router.post(
  "/reset-password",
  [
    body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits").isNumeric().withMessage("OTP must be numeric"),
    body("newPassword").isLength({ min: 6 }).withMessage("New password must be at least 6 characters"),
  ],
  validate,
  ctrl.resetPassword
);

module.exports = router;
