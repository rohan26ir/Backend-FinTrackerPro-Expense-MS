const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["income", "expense", "Income", "Expense", "Savings", "savings"],
      required: [true, "Transaction type is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be positive"],
    },
    currency: { type: String, default: "BDT" },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    // For expense: which account/wallet (cash, bank, card, wallet)
    account: { type: String, default: "" },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    recurrence: {
      type: String,
      enum: ["None", "Daily", "Weekly", "Monthly", "Yearly"],
      default: "None",
    },
    note: { type: String, trim: true, maxlength: [500, "Note too long"], default: "" },
    tags: { type: [String], default: [] },
    receiptUrl: { type: String, default: "" }, // placeholder for future file upload
    isDeleted: { type: Boolean, default: false }, // soft delete
  },
  { timestamps: true }
);

// ── Compound index for efficient per-user date range queries ──────────────────
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, type: 1, date: -1 });

// ── Soft-delete query helper ──────────────────────────────────────────────────
transactionSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model("Transaction", transactionSchema);
