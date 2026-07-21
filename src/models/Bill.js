// src/models/Bill.js
const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Bill name is required"],
      trim: true,
      maxlength: [100, "Name too long"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be positive"],
    },
    currency: { type: String, default: "BDT" },
    category: { type: String, default: "Utilities", trim: true },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    recurrence: {
      type: String,
      enum: ["None", "Daily", "Weekly", "Monthly", "Yearly"],
      default: "Monthly",
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    reminderDaysBefore: { type: Number, default: 3, min: 0, max: 30 },
    note: { type: String, default: "", maxlength: [300, "Note too long"] },
    icon: { type: String, default: "Bell" },
    color: { type: String, default: "#F87171" },
  },
  { timestamps: true }
);

billSchema.index({ user: 1, dueDate: 1 });

module.exports = mongoose.model("Bill", billSchema);
