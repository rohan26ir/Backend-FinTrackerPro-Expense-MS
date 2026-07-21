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

    const user = await User.findById(decoded.id).select("-password -refreshToken").lean();
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect };
