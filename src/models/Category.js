const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
      maxlength: [50, "Name too long"],
    },
    type: {
      type: String,
      enum: ["income", "expense", "both"],
      required: [true, "Category type is required"],
    },
    icon: { type: String, default: "Package" }, // lucide icon name
    color: {
      type: String,
      default: "#9CA3AF",
      match: [/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, "Invalid hex color"],
    },
    isDefault: { type: Boolean, default: false }, // seeded default categories
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Unique category name per user + type
categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

// Exclude soft-deleted
categorySchema.pre(/^find/, function (next) {
  this.where({ isDeleted: false });
  next();
});

module.exports = mongoose.model("Category", categorySchema);
