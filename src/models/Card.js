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
      default: "My Card",
      trim: true,
      maxlength: [100, "Label too long"],
    },
    cardName: { type: String, default: "My Card", trim: true },
    cardNumber: { type: String, default: "" },
    expiryDate: { type: String, default: "12/28" },
    cardType: { type: String, default: "Visa" },
    limit: { type: Number, default: 5000 },
    used: { type: Number, default: 0 },
    status: { type: String, default: "Active" },
    type: {
      type: String,
      default: "debit",
    },
    last4: {
      type: String,
      default: "4821",
    },
    bank: { type: String, default: "", trim: true },
    color: { type: String, default: "#6366F1" },
    balance: { type: Number, default: 5000 },
    currency: { type: String, default: "USD" },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Card", cardSchema);
