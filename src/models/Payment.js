const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: { type: String, default: "User" },
    userEmail: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    plan: { type: String, default: "premium" },
    billingCycle: { type: String, default: "yearly" },
    stripePaymentIntentId: { type: String, default: "" },
    status: { type: String, default: "succeeded" },
    paymentMethod: { type: String, default: "card" },
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);
