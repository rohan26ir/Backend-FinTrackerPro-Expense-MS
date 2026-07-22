const User = require("../models/User");

/**
 * GET /api/users
 * Public – returns all active users (public profiles)
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    // Fetch only active users, exclude sensitive fields
    const users = await User.find({ isActive: true })
      .select("-password -refreshToken -resetOtp -resetOtpExpiry -__v")
      .lean();

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/users/:username
 * Public – returns a single user's public profile
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

    res.json({
      success: true,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    next(error);
  }
};