const Budget = require("../models/Budget");
const Transaction = require("../models/Transaction");

/**
 * GET /api/budgets
 * Returns budgets with spent amounts computed from transactions.
 */
exports.getAll = async (req, res, next) => {
  try {
    const now = new Date();
    const budgets = await Budget.find({ user: req.user._id, isActive: true }).lean();

    const enriched = await Promise.all(
      budgets.map(async (b) => {
        let startDate, endDate;
        const y = b.year || now.getFullYear();
        const m = b.month || now.getMonth() + 1;

        if (b.period === "monthly") {
          startDate = new Date(y, m - 1, 1);
          endDate = new Date(y, m, 0, 23, 59, 59);
        } else if (b.period === "weekly") {
          const day = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - day);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate = new Date(y, 0, 1);
          endDate = new Date(y, 11, 31, 23, 59, 59);
        }

        const [agg] = await Transaction.aggregate([
          {
            $match: {
              user: req.user._id,
              type: { $in: ["expense", "Expense"] },
              category: new RegExp(b.category || b.name || "", "i"),
              date: { $gte: startDate, $lte: endDate },
              isDeleted: false,
            },
          },
          { $group: { _id: null, spent: { $sum: "$amount" } } },
        ]);

        const spent = agg?.spent || 0;
        const targetAmount = b.amount || b.budgeted || 0;

        return {
          ...b,
          id: b._id.toString(),
          name: b.category || b.name || "Category",
          category: b.category || b.name || "Category",
          budgeted: targetAmount,
          amount: targetAmount,
          spent,
          remaining: Math.max(0, targetAmount - spent),
          percentUsed: targetAmount ? Math.min(100, Math.round((spent / targetAmount) * 100)) : 0,
        };
      })
    );

    res.json({ success: true, data: enriched });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/budgets
 */
exports.create = async (req, res, next) => {
  try {
    const { category, name, amount, budgeted, currency, period, month, year, color, icon } = req.body;
    const now = new Date();
    const categoryName = (category || name || "Category").trim();
    const targetAmount = parseFloat(amount || budgeted || 0);

    const budget = await Budget.create({
      user: req.user._id,
      category: categoryName,
      amount: targetAmount,
      currency: currency || "USD",
      period: period || "monthly",
      month: month || now.getMonth() + 1,
      year: year || now.getFullYear(),
      color: color || "#818CF8",
      icon: icon || "Target",
    });

    res.status(201).json({
      success: true,
      data: {
        ...budget.toObject(),
        id: budget._id.toString(),
        name: categoryName,
        budgeted: targetAmount,
        spent: 0,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/budgets/:id
 */
exports.update = async (req, res, next) => {
  try {
    const allowed = ["category", "name", "amount", "budgeted", "currency", "period", "month", "year", "color", "icon", "isActive"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    
    if (updates.name && !updates.category) updates.category = updates.name;
    if (updates.budgeted && !updates.amount) updates.amount = parseFloat(updates.budgeted);
    if (updates.amount) updates.amount = parseFloat(updates.amount);

    const budget = await Budget.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!budget) return res.status(404).json({ success: false, message: "Budget not found" });
    res.json({
      success: true,
      data: {
        ...budget.toObject(),
        id: budget._id.toString(),
        name: budget.category,
        budgeted: budget.amount,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/budgets/:id
 */
exports.remove = async (req, res, next) => {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!budget) return res.status(404).json({ success: false, message: "Budget not found" });
    res.json({ success: true, message: "Budget deleted" });
  } catch (err) {
    next(err);
  }
};
