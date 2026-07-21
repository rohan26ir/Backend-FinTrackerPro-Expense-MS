const Transaction = require("../models/Transaction");

// ─── Helper: build query filter ──────────────────────────────────────────────
const buildFilter = (userId, query) => {
  const filter = { user: userId };

  if (query.type && ["income", "expense"].includes(query.type)) {
    filter.type = query.type;
  }
  if (query.category) {
    filter.category = new RegExp(query.category, "i");
  }
  if (query.account) {
    filter.account = query.account;
  }
  if (query.search) {
    filter.$or = [
      { category: new RegExp(query.search, "i") },
      { note: new RegExp(query.search, "i") },
      { tags: new RegExp(query.search, "i") },
    ];
  }
  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }
  if (query.tags) {
    filter.tags = { $in: query.tags.split(",") };
  }

  return filter;
};

/**
 * GET /api/transactions
 */
exports.getAll = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;
    const sortField = req.query.sortBy || "date";
    const sortOrder = req.query.order === "asc" ? 1 : -1;

    const filter = buildFilter(req.user._id, req.query);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ [sortField]: sortOrder }).skip(skip).limit(limit).lean(),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/transactions
 */
exports.create = async (req, res, next) => {
  try {
    const { type, amount, currency, category, account, date, recurrence, note, tags } = req.body;

    const transaction = await Transaction.create({
      user: req.user._id,
      type,
      amount: parseFloat(amount),
      currency,
      category,
      account: account || "",
      date: date ? new Date(date) : new Date(),
      recurrence: recurrence || "None",
      note: note || "",
      tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/transactions/:id
 */
exports.getOne = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    res.json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/transactions/:id
 */
exports.update = async (req, res, next) => {
  try {
    const allowed = ["type", "amount", "currency", "category", "account", "date", "recurrence", "note", "tags"];
    const updates = {};
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });
    if (updates.amount) updates.amount = parseFloat(updates.amount);
    if (updates.date) updates.date = new Date(updates.date);
    if (updates.tags) updates.tags = updates.tags.slice(0, 5);

    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    res.json({ success: true, data: transaction });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/transactions/:id  (soft delete)
 */
exports.remove = async (req, res, next) => {
  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isDeleted: true },
      { new: true }
    );
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }
    res.json({ success: true, message: "Transaction deleted" });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/transactions/summary
 * Returns totals: totalIncome, totalExpense, balance, totalSavings
 */
exports.summary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.$lte = end;
    }

    const matchStage = { user: userId };
    if (Object.keys(dateFilter).length) matchStage.date = dateFilter;

    const result = await Transaction.aggregate([
      { $match: { ...matchStage, isDeleted: false } },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const income = result.find((r) => r._id === "income") || { total: 0, count: 0 };
    const expense = result.find((r) => r._id === "expense") || { total: 0, count: 0 };

    res.json({
      success: true,
      data: {
        totalIncome: income.total,
        totalExpense: expense.total,
        balance: income.total - expense.total,
        incomeCount: income.count,
        expenseCount: expense.count,
      },
    });
  } catch (err) {
    next(err);
  }
};
