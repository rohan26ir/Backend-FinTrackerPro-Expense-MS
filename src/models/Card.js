const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: [true, "Card label is required"],
      trim: true,
      maxlength: [50, "Label too long"],
    },
    type: {
      type: String,
      enum: ["debit", "credit", "prepaid", "other"],
      default: "debit",
    },
    last4: {
      type: String,
      match: [/^\d{4}$/, "last4 must be exactly 4 digits"],
      default: "",
    },
    bank: { type: String, default: "", trim: true },
    color: { type: String, default: "#6366F1" }, // card gradient start
    balance: { type: Number, default: 0 },
    currency: { type: String, default: "BDT" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Card", cardSchema);
