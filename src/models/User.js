const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

async function generateUniqueUsername(base) {
  let clean = base
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");
  if (!clean) clean = "user";

  let candidate = clean;
  let counter = 1;
  while (await mongoose.model("User").exists({ username: candidate })) {
    candidate = `${clean}_${counter}`;
    counter++;
  }
  return candidate;
}

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name too long"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9_]+$/, "Username can only contain letters, numbers and underscores"],
    },
    bio: {
      type: String,
      maxlength: [500, "Bio must be under 500 characters"],
      default: "",
    },
    socialMedia: {
      facebook: { type: String, default: "" },
      twitter: { type: String, default: "" },
      instagram: { type: String, default: "" },
      whatsapp: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      youtube: { type: String, default: "" },
      website: { type: String, default: "" },
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    organizationName: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },
    plan: {
      type: String,
      enum: ["free", "pro", "enterprise"],
      default: "free",
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },
    avatar: { type: String, default: "" },
    currency: { type: String, default: "BDT" },
    timezone: { type: String, default: "Asia/Dhaka" },
    refreshToken: { type: String, select: false },
    resetOtp: { type: String, select: false },
    resetOtpExpiry: { type: Date, select: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Pre-save hook with proper error handling
userSchema.pre("save", async function (next) {
  try {
    // Only generate username on creation if not provided
    if (this.isNew && !this.username) {
      const base = this.name || "user";
      this.username = await generateUniqueUsername(base);
    }
    if (this.isModified("password")) {
      this.password = await bcrypt.hash(this.password, 12);
    }
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.statics.findByUsername = function (username) {
  return this.findOne({ username });
};

userSchema.methods.getPublicProfile = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.resetOtp;
  delete obj.resetOtpExpiry;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model("User", userSchema);