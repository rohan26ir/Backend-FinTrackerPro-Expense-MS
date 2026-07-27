const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Bill = require("../models/Bill");
const Budget = require("../models/Budget");

/**
 * GET /api/users
 * Returns all users (for Admin Dashboard & User Management)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select("-password -refreshToken -resetOtp -resetOtpExpiry -__v")
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: users.map((u) => ({ ...u, id: u._id.toString() })),
      users: users.map((u) => ({ ...u, id: u._id.toString() })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/users/:id
 * Admin endpoint to update user role, plan, or active status
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role, plan, isActive } = req.body;

    const updates = {};
    if (role) updates.role = role;
    if (plan) {
      updates.plan = plan;
      if (plan === "free") {
        updates.planExpiresAt = null;
      } else if (!req.body.planExpiresAt) {
        updates.planExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      }
    }
    if (req.body.planExpiresAt !== undefined) {
      updates.planExpiresAt = req.body.planExpiresAt ? new Date(req.body.planExpiresAt) : null;
    }
    if (typeof isActive === "boolean") updates.isActive = isActive;

    const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true })
      .select("-password -refreshToken -resetOtp -resetOtpExpiry")
      .lean();

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user: { ...updatedUser, id: updatedUser._id.toString() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:username
 * Public – returns a single user's public profile with privacy-safe real activity counts & earned badges
 */
exports.getPublicUser = async (req, res, next) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userId = user._id;

    // Real DB non-sensitive activity counts (Zero monetary amounts exposed!)
    const totalTransactionsCount = await Transaction.countDocuments({ user: userId, isDeleted: false });
    const totalBillsCount = await Bill.countDocuments({ user: userId });
    const activeBudgetsCount = await Budget.countDocuments({ user: userId, isActive: true });

    // Dynamic earned badges based on actual DB records
    const earnedBadges = [
      { id: "verified", name: "Verified Account", desc: "Identity & Security Verified", icon: "ShieldCheck", color: "emerald" },
    ];

    if (user.plan === "premium") {
      earnedBadges.push({ id: "premium", name: "Premium Member", desc: "Premium Feature Access", icon: "Crown", color: "amber" });
    }

    if (activeBudgetsCount > 0) {
      earnedBadges.push({ id: "budgeter", name: "Budget Planner", desc: `${activeBudgetsCount} Categories Set`, icon: "Target", color: "indigo" });
    }

    if (totalBillsCount > 0) {
      earnedBadges.push({ id: "bill_master", name: "Bill Manager", desc: `${totalBillsCount} Bills Tracked`, icon: "Bell", color: "blue" });
    }

    if (totalTransactionsCount >= 5) {
      earnedBadges.push({ id: "active_logger", name: "Consistent Logger", desc: "Regular Financial Activity", icon: "Zap", color: "violet" });
    }

    const publicProfile = user.getPublicProfile();

    res.json({
      success: true,
      user: {
        ...publicProfile,
        activitySummary: {
          totalTransactionsCount,
          totalBillsCount,
          activeBudgetsCount,
          earnedBadges,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};