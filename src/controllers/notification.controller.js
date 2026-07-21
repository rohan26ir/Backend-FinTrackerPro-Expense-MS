const Notification = require("../models/Notification");

/**
 * GET /api/notifications?unread=true
 */
exports.getAll = async (req, res, next) => {
  try {
    const filter = { user: req.user._id };
    if (req.query.unread === "true") filter.isRead = false;

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

    res.json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/:id/read
 */
exports.markRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
    res.json({ success: true, data: notification });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/notifications/read-all
 */
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
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
    const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found" });
    res.json({ success: true, message: "Notification deleted" });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/notifications  — clear all
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
 * Internal helper: create a notification (used by other controllers)
 */
exports.createNotification = async (userId, { title, message, type = "info", link = "", icon = "Bell" }) => {
  try {
    await Notification.create({ user: userId, title, message, type, link, icon });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
  }
};
