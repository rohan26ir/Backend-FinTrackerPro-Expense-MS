const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Category = require("../models/Category");
const Budget = require("../models/Budget");
const Saving = require("../models/Saving");
const Bill = require("../models/Bill");
const Notification = require("../models/Notification");
const Card = require("../models/Card");

/**
 * GET /api/profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).lean();
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Stats summary
    const [txCount] = await Transaction.aggregate([
      { $match: { user: req.user._id, isDeleted: false } },
      { $group: { _id: null, income: { $sum: { $cond: [{ $eq: ["$type","income"] }, "$amount", 0] } },
                              expense: { $sum: { $cond: [{ $eq: ["$type","expense"] }, "$amount", 0] } },
                              count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        currency: user.currency,
        timezone: user.timezone,
        createdAt: user.createdAt,
        stats: {
          totalTransactions: txCount?.count || 0,
          totalIncome: txCount?.income || 0,
          totalExpense: txCount?.expense || 0,
          netWorth: (txCount?.income || 0) - (txCount?.expense || 0),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/profile
 * Update name, avatar, currency, timezone
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ["name", "avatar", "currency", "timezone"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    res.json({
      success: true,
      message: "Profile updated",
      data: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar, currency: user.currency },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/profile/change-password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both passwords are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    user.password = newPassword;
    user.refreshToken = ""; // force re-login on other devices
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/profile
 * Permanently delete account and all associated data
 */
exports.deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ success: false, message: "Password confirmation required" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    const uid = req.user._id;
    await Promise.all([
      Transaction.deleteMany({ user: uid }),
      Category.deleteMany({ user: uid }),
      Budget.deleteMany({ user: uid }),
      Saving.deleteMany({ user: uid }),
      Bill.deleteMany({ user: uid }),
      Notification.deleteMany({ user: uid }),
      Card.deleteMany({ user: uid }),
      User.findByIdAndDelete(uid),
    ]);

    res.json({ success: true, message: "Account and all data permanently deleted" });
  } catch (err) {
    next(err);
  }
};
