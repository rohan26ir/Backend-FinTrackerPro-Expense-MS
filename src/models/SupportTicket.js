const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: { type: String, default: "User" },
    userEmail: { type: String, required: true },
    subject: { type: String, required: true, trim: true },
    category: { type: String, default: "general" },
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "replied", "resolved"], default: "open" },
    replies: [
      {
        senderRole: { type: String, required: true }, // "user", "admin", "moderator"
        senderName: { type: String, required: true },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    unreadByUser: { type: Boolean, default: false },
    unreadByAdmin: { type: Boolean, default: true },
  },
  { timestamps: true }
);

supportTicketSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("SupportTicket", supportTicketSchema);
