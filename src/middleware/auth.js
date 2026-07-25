const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * Middleware: verify Bearer JWT access token.
 * Attaches `req.user` (lean user doc) on success.
 */
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (err) {
      const msg = err.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
      return res.status(401).json({ success: false, message: msg });
    }

    let user = await User.findById(decoded.id).select("-password -refreshToken").lean();
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    // Auto-downgrade to Free plan if subscription period has ended
    if (user.plan && user.plan !== "free" && user.planExpiresAt && new Date() > new Date(user.planExpiresAt)) {
      await User.findByIdAndUpdate(user._id, {
        plan: "free",
        subscriptionStatus: "expired",
        planExpiresAt: null,
      });
      user.plan = "free";
      user.subscriptionStatus = "expired";
      user.planExpiresAt = null;
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect };
