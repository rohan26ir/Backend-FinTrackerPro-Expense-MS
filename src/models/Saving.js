const mongoose = require("mongoose");

const savingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Savings goal name is required"],
      trim: true,
      maxlength: [100, "Name too long"],
    },
    targetAmount: {
      type: Number,
      required: [true, "Target amount is required"],
      min: [1, "Target must be positive"],
    },
    currentAmount: { type: Number, default: 0, min: 0 },
    currency: { type: String, default: "BDT" },
    deadline: { type: Date },
    icon: { type: String, default: "PiggyBank" },
    color: { type: String, default: "#4ADE80" },
    description: { type: String, default: "", maxlength: [300, "Description too long"] },
    isCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Virtual: progress percentage
savingSchema.virtual("progress").get(function () {
  if (!this.targetAmount) return 0;
  return Math.min(100, Math.round((this.currentAmount / this.targetAmount) * 100));
});

savingSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Saving", savingSchema);
