const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * GET /api/notifications
 */
exports.getAll = async (req, res, next) => {
  try {
    const filter = {
      $or: [
        { user: req.user._id },
        { isBroadcast: true },
      ],
    };
    if (req.query.unread === "true") filter.isRead = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({
      $or: [
        { user: req.user._id, isRead: false },
        { isBroadcast: true, isRead: false },
      ],
    });

    res.json({
      success: true,
      data: notifications.map((n) => ({ ...n, id: n._id.toString() })),
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/notifications/unread-count
 */
exports.getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      $or: [
        { user: req.user._id, isRead: false },
        { isBroadcast: true, isRead: false },
      ],
    });
    res.json({ success: true, count: unreadCount });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/notifications/broadcast
 * Admins & Moderators can post system-wide notifications for all users
 */
exports.broadcastNotification = async (req, res, next) => {
  try {
    const user = req.user;
    const isAdminOrMod = user.role === "admin" || user.role === "moderator" || user.email.toLowerCase() === "rohan26ir@gmail.com";

    if (!isAdminOrMod) {
      return res.status(403).json({ success: false, message: "Access denied. Admin or Moderator privileges required." });
    }

    const { title, message, type = "announcement", link = "" } = req.body;

    const notification = await Notification.create({
      isBroadcast: true,
      title: title.trim(),
      message: message.trim(),
      type,
      link,
      icon: "Megaphone",
    });

    res.status(201).json({
      success: true,
      message: "Broadcast notification sent to all users!",
      data: { ...notification.toObject(), id: notification._id.toString() },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/:id/read
 */
exports.markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
    res.json({ success: true, data: { ...notification.toObject(), id: notification._id.toString() } });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/read-all
 */
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ $or: [{ user: req.user._id }, { isBroadcast: true }] }, { isRead: true });
    res.json({ success: true, message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/notifications/:id
 */
exports.remove = async (req, res, next) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/notifications — clear all
 */
exports.clearAll = async (req, res, next) => {
  try {
    await Notification.deleteMany({ user: req.user._id });
    res.json({ success: true, message: "All notifications cleared" });
  } catch (err) {
    next(err);
  }
};

/**
 * Internal helper
 */
exports.createNotification = async (userId, { title, message, type = "info", link = "", icon = "Bell" }) => {
  try {
    await Notification.create({ user: userId, title, message, type, link, icon });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
  }
};
