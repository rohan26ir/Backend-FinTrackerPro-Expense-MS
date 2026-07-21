const Category = require("../models/Category");

// Default seed categories that every new user gets (created on first fetch)
const INCOME_DEFAULTS = [
  { name: "Salary",     icon: "Briefcase",  color: "#818CF8" },
  { name: "Freelance",  icon: "Laptop",     color: "#F472B6" },
  { name: "Investment", icon: "TrendingUp", color: "#4ADE80" },
  { name: "Business",   icon: "Building2",  color: "#FBBF24" },
  { name: "Rental",     icon: "Home",       color: "#60A5FA" },
  { name: "Gift",       icon: "Gift",       color: "#C084FC" },
  { name: "Refund",     icon: "RefreshCcw", color: "#F87171" },
  { name: "Other",      icon: "Package",    color: "#9CA3AF" },
];

const EXPENSE_DEFAULTS = [
  { name: "Food",          icon: "Utensils",    color: "#FF6B6B" },
  { name: "Transport",     icon: "Bus",         color: "#4ECDC4" },
  { name: "Shopping",      icon: "ShoppingBag", color: "#FFE66D" },
  { name: "Health",        icon: "HeartPulse",  color: "#A8E6CF" },
  { name: "Entertainment", icon: "Tv",          color: "#C3A6FF" },
  { name: "Utilities",     icon: "Zap",         color: "#FFB347" },
  { name: "Education",     icon: "BookOpen",    color: "#87CEEB" },
  { name: "Other",         icon: "Package",     color: "#9CA3AF" },
];

const seedDefaults = async (userId) => {
  const existing = await Category.countDocuments({ user: userId });
  if (existing > 0) return;

  const docs = [
    ...INCOME_DEFAULTS.map((c) => ({ ...c, user: userId, type: "income", isDefault: true })),
    ...EXPENSE_DEFAULTS.map((c) => ({ ...c, user: userId, type: "expense", isDefault: true })),
  ];

  await Category.insertMany(docs, { ordered: false }).catch(() => {}); // ignore duplicate errors
};

/**
 * GET /api/categories?type=income|expense|both
 */
exports.getAll = async (req, res, next) => {
  try {
    // Seed defaults on first visit
    await seedDefaults(req.user._id);

    const filter = { user: req.user._id };
    if (req.query.type && ["income", "expense", "both"].includes(req.query.type)) {
      filter.type = req.query.type;
    }

    const categories = await Category.find(filter).sort({ isDefault: -1, name: 1 }).lean();
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/categories
 */
exports.create = async (req, res, next) => {
  try {
    const { name, type, icon, color } = req.body;

    const category = await Category.create({
      user: req.user._id,
      name,
      type,
      icon: icon || "Package",
      color: color || "#9CA3AF",
    });

    res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/categories/:id
 */
exports.update = async (req, res, next) => {
  try {
    const { name, icon, color } = req.body;

    const category = await Category.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, icon, color },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/categories/:id  (soft delete)
 */
exports.remove = async (req, res, next) => {
  try {
    const category = await Category.findOne({ _id: req.params.id, user: req.user._id });
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }
    if (category.isDefault) {
      return res.status(403).json({ success: false, message: "Default categories cannot be deleted" });
    }

    category.isDeleted = true;
    await category.save();

    res.json({ success: true, message: "Category deleted" });
  } catch (err) {
    next(err);
  }
};
