const mongoose = require("mongoose");

const taxDeductionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Deduction title is required"],
      trim: true,
      maxlength: [100, "Title too long"],
    },
    category: {
      type: String,
      enum: ["Charity", "Education", "Healthcare", "Home Office", "Mortgage Interest", "Retirement", "Business", "Other"],
      default: "Other",
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be positive"],
    },
    taxYear: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    date: {
      type: Date,
      default: Date.now,
    },
    receiptNumber: { type: String, trim: true },
    notes: { type: String, default: "", maxlength: [500, "Notes too long"] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TaxDeduction", taxDeductionSchema);
