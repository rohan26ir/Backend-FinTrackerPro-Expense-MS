const Transaction = require("../models/Transaction");
const mongoose = require("mongoose");

/**
 * GET /api/analytics/dashboard
 * Summary stats: totalIncome, totalExpense, balance, savings
 * Optional query: ?month=7&year=2026  (defaults to current month)
 */
exports.dashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year) || now.getFullYear();
    const month = parseInt(req.query.month) || now.getMonth() + 1;

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Previous month for comparison
    const prevStart = new Date(year, month - 2, 1);
    const prevEnd = new Date(year, month - 1, 0, 23, 59, 59, 999);

    const userId = new mongoose.Types.ObjectId(req.user._id);

    const aggregate = async (start, end) =>
      Transaction.aggregate([
        { $match: { user: userId, date: { $gte: start, $lte: end }, isDeleted: false } },
        { $group: { _id: "$type", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]);

    const [current, previous] = await Promise.all([
      aggregate(startOfMonth, endOfMonth),
      aggregate(prevStart, prevEnd),
    ]);

    const get = (arr, type) => arr.find((r) => r._id === type) || { total: 0, count: 0 };

    const curIncome  = get(current, "income");
    const curExpense = get(current, "expense");
    const prevIncome = get(previous, "income");
    const prevExpense = get(previous, "expense");

    const pctChange = (cur, prev) =>
      prev.total === 0 ? null : Math.round(((cur.total - prev.total) / prev.total) * 100);

    // Total all-time for savings calculation
    const [allTime] = await Transaction.aggregate([
      { $match: { user: userId, isDeleted: false } },
      { $group: { _id: "$type", total: { $sum: "$amount" } } },
    ]).then((r) => [r]);

    const allTimeArr = Array.isArray(allTime) ? allTime : [];
    const totalIncome  = (allTimeArr.find ? allTimeArr.find((r) => r._id === "income")?.total  : 0) || 0;
    const totalExpense = (allTimeArr.find ? allTimeArr.find((r) => r._id === "expense")?.total : 0) || 0;

    res.json({
      success: true,
      data: {
        period: { month, year },
        monthlyIncome:  curIncome.total,
        monthlyExpense: curExpense.total,
        monthlyBalance: curIncome.total - curExpense.total,
        incomeChange:   pctChange(curIncome, prevIncome),
        expenseChange:  pctChange(curExpense, prevExpense),
        allTimeIncome:  totalIncome,
        allTimeExpense: totalExpense,
        totalSavings:   totalIncome - totalExpense,
        currentBalance: totalIncome - totalExpense,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analytics/chart
 * Monthly income vs expense for the last N months (default 7)
 * Query: ?months=7
 */
exports.chart = async (req, res, next) => {
  try {
    const months = Math.min(24, parseInt(req.query.months) || 7);
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

    const data = await Transaction.aggregate([
      {
        $match: {
          user: userId,
          date: { $gte: startDate },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: {
            year:  { $year: "$date" },
            month: { $month: "$date" },
            type:  "$type",
          },
          total: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Build ordered month labels
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const result = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const label = MONTHS[d.getMonth()];

      const income  = data.find((r) => r._id.year === y && r._id.month === m && r._id.type === "income")?.total  || 0;
      const expense = data.find((r) => r._id.year === y && r._id.month === m && r._id.type === "expense")?.total || 0;

      result.push({ name: label, income, expense, month: m, year: y });
    }

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analytics/by-category
 * Expense breakdown by category for a given month
 * Query: ?month=7&year=2026&type=expense
 */
exports.byCategory = async (req, res, next) => {
  try {
    const now = new Date();
    const year  = parseInt(req.query.year)  || now.getFullYear();
    const month = parseInt(req.query.month) || now.getMonth() + 1;
    const type  = req.query.type === "income" ? "income" : "expense";

    const userId = new mongoose.Types.ObjectId(req.user._id);
    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month, 0, 23, 59, 59, 999);

    const data = await Transaction.aggregate([
      { $match: { user: userId, type, date: { $gte: start, $lte: end }, isDeleted: false } },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    const grand = data.reduce((s, d) => s + d.total, 0);
    const result = data.map((d) => ({
      category: d._id,
      total: d.total,
      count: d.count,
      percentage: grand ? Math.round((d.total / grand) * 100) : 0,
    }));

    res.json({ success: true, data: result, total: grand });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/analytics/trends
 * Daily totals for a date range
 * Query: ?startDate=2026-07-01&endDate=2026-07-21&type=expense
 */
exports.trends = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);
    const now = new Date();
    const startDate = req.query.startDate ? new Date(req.query.startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate   = req.query.endDate   ? new Date(req.query.endDate)   : now;
    const type      = ["income", "expense"].includes(req.query.type) ? req.query.type : undefined;

    const matchStage = {
      user: userId,
      date: { $gte: startDate, $lte: endDate },
      isDeleted: false,
    };
    if (type) matchStage.type = type;

    const data = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            type: "$type",
          },
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.date": 1 } },
    ]);

    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
