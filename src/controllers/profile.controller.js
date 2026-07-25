const User = require("../models/User");
const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const Saving = require("../models/Saving");
const Bill = require("../models/Bill");
const Notification = require("../models/Notification");

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
      {
        $group: {
          _id: null,
          income: { $sum: { $cond: [{ $eq: ["$type", "income"] }, "$amount", 0] } },
          expense: { $sum: { $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0] } },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        currency: user.currency,
        socialMedia: user.socialMedia,          // full social object
        bio: user.bio,
        organization: user.organizationName,    // map to frontend expected field
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
 * Update all allowed fields (name, currency, bio, avatar, organizationName, socialMedia, timezone)
 */
exports.updateProfile = async (req, res, next) => {
  try {
    // Map frontend field names → model field names
    const fieldMap = {
      name: "name",
      currency: "currency",
      bio: "bio",
      avatar: "avatar",
      timezone: "timezone",
      socialMedia: "socialMedia",   // same name
      organization: "organizationName", // frontend sends string → store in organizationName
    };

    const updates = {};
    for (const [frontendKey, modelKey] of Object.entries(fieldMap)) {
      if (req.body[frontendKey] !== undefined) {
        updates[modelKey] = req.body[frontendKey];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    res.json({
      success: true,
      message: "Profile updated",
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        currency: user.currency,
        bio: user.bio,
        organization: user.organizationName,   // map back to frontend field
        socialMedia: user.socialMedia,
        timezone: user.timezone,
      },
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
    user.refreshToken = "";
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/profile
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
      Budget.deleteMany({ user: uid }),
      Saving.deleteMany({ user: uid }),
      Bill.deleteMany({ user: uid }),
      Notification.deleteMany({ user: uid }),
      User.findByIdAndDelete(uid),
    ]);

    res.json({ success: true, message: "Account and all data permanently deleted" });
  } catch (err) {
    next(err);
  }
};