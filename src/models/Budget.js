const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Budget amount is required"],
      min: [1, "Budget must be positive"],
    },
    currency: { type: String, default: "BDT" },
    period: {
      type: String,
      enum: ["weekly", "monthly", "yearly"],
      default: "monthly",
    },
    // Month/year this budget applies to (for monthly budgets)
    month: { type: Number, min: 1, max: 12 }, // 1–12
    year: { type: Number },
    color: { type: String, default: "#818CF8" },
    icon: { type: String, default: "Target" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

budgetSchema.index({ user: 1, category: 1, period: 1 });

module.exports = mongoose.model("Budget", budgetSchema);
