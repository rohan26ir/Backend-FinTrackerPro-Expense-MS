const SupportTicket = require("../models/SupportTicket");

/**
 * POST /api/help/tickets
 * Create a new help & support ticket
 */
exports.createTicket = async (req, res, next) => {
  try {
    const { subject, category, message } = req.body;
    const user = req.user;

    const ticket = await SupportTicket.create({
      user: user._id,
      userName: user.name || "User",
      userEmail: user.email,
      subject: subject.trim(),
      category: category || "general",
      message: message.trim(),
      status: "open",
      unreadByUser: false,
      unreadByAdmin: true,
    });

    res.status(201).json({
      success: true,
      message: "Help ticket submitted successfully! An Admin or Moderator will reply shortly.",
      ticket: { ...ticket.toObject(), id: ticket._id.toString() },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/help/tickets
 * Regular users see their own tickets. Admins & Moderators see ALL tickets with populated user avatars.
 */
exports.getTickets = async (req, res, next) => {
  try {
    const user = req.user;
    const isAdminOrMod = user.role === "admin" || user.role === "moderator" || user.email.toLowerCase() === "rohan26ir@gmail.com";

    const filter = isAdminOrMod ? {} : { user: user._id };
    const tickets = await SupportTicket.find(filter)
      .sort({ updatedAt: -1 })
      .populate("user", "avatar name email")
      .lean();

    res.json({
      success: true,
      data: tickets.map((t) => ({
        ...t,
        id: t._id.toString(),
        userAvatar: t.user && typeof t.user === "object" ? t.user.avatar : "",
      })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/help/tickets/:id/reply
 * Add a reply to a help ticket (User or Admin/Moderator)
 */
exports.addReply = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const user = req.user;

    const isAdminOrMod = user.role === "admin" || user.role === "moderator" || user.email.toLowerCase() === "rohan26ir@gmail.com";
    const senderRole = isAdminOrMod ? (user.role === "moderator" ? "moderator" : "admin") : "user";

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Ticket not found" });
    }

    // Append reply
    ticket.replies.push({
      senderRole,
      senderName: user.name || (isAdminOrMod ? "Support Team" : "User"),
      message: message.trim(),
      createdAt: new Date(),
    });

    // Update status and unread flags
    if (isAdminOrMod) {
      ticket.status = "replied";
      ticket.unreadByUser = true;
      ticket.unreadByAdmin = false;
    } else {
      ticket.status = "open";
      ticket.unreadByUser = false;
      ticket.unreadByAdmin = true;
    }

    await ticket.save();

    res.json({
      success: true,
      message: "Reply sent!",
      ticket: { ...ticket.toObject(), id: ticket._id.toString() },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/help/tickets/:id (Protected - Admin/Mod)
 * Delete a support ticket
 */
exports.deleteTicket = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const isAdminOrMod = user.role === "admin" || user.role === "moderator" || user.email.toLowerCase() === "rohan26ir@gmail.com";

    if (!isAdminOrMod) {
      return res.status(403).json({ success: false, message: "Access denied. Admin or Moderator privileges required to delete support tickets." });
    }

    const ticket = await SupportTicket.findByIdAndDelete(id);
    if (!ticket) {
      return res.status(404).json({ success: false, message: "Support ticket not found." });
    }

    res.json({ success: true, message: "Support ticket deleted successfully." });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/help/unread-count
 * Header nav counter endpoint
 */
exports.getUnreadHelpCount = async (req, res, next) => {
  try {
    const user = req.user;
    const isAdminOrMod = user.role === "admin" || user.role === "moderator" || user.email.toLowerCase() === "rohan26ir@gmail.com";

    let count = 0;
    if (isAdminOrMod) {
      count = await SupportTicket.countDocuments({ unreadByAdmin: true });
    } else {
      count = await SupportTicket.countDocuments({ user: user._id, unreadByUser: true });
    }

    res.json({ success: true, count });
  } catch (err) {
    next(err);
  }
};
