const mongoose = require("mongoose");

const investmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Investment name is required"],
      trim: true,
      maxlength: [100, "Name too long"],
    },
    type: {
      type: String,
      enum: ["Stocks", "Crypto", "Real Estate", "Bonds", "Mutual Funds", "Etf", "Other"],
      default: "Stocks",
    },
    symbol: { type: String, trim: true, uppercase: true },
    purchasePrice: {
      type: Number,
      required: [true, "Purchase price is required"],
      min: [0, "Purchase price must be positive"],
    },
    currentPrice: {
      type: Number,
      required: [true, "Current price is required"],
      min: [0, "Current price must be positive"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0.00001, "Quantity must be positive"],
    },
    currency: { type: String, default: "USD" },
    purchaseDate: { type: Date, default: Date.now },
    notes: { type: String, default: "", maxlength: [500, "Notes too long"] },
  },
  { timestamps: true }
);

// Virtuals: totalInvested, currentValue, returns, returnsPercentage
investmentSchema.virtual("totalInvested").get(function () {
  return (this.purchasePrice || 0) * (this.quantity || 0);
});

investmentSchema.virtual("currentValue").get(function () {
  return (this.currentPrice || 0) * (this.quantity || 0);
});

investmentSchema.virtual("returns").get(function () {
  return (this.currentPrice - this.purchasePrice) * this.quantity;
});

investmentSchema.virtual("returnsPercentage").get(function () {
  if (!this.purchasePrice || this.purchasePrice === 0) return 0;
  return Number((((this.currentPrice - this.purchasePrice) / this.purchasePrice) * 100).toFixed(2));
});

investmentSchema.set("toJSON", { virtuals: true });
investmentSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Investment", investmentSchema);
