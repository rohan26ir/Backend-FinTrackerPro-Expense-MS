const mongoose = require("mongoose");

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    phone: { type: String, default: "" },
    status: { type: String, enum: ["pending", "answered"], default: "pending" },
    replyMessage: { type: String, default: "" },
    repliedBy: { type: String, default: "" },
    repliedAt: { type: Date },
  },
  { timestamps: true }
);

contactMessageSchema.index({ createdAt: -1, status: 1 });

module.exports = mongoose.model("ContactMessage", contactMessageSchema);
