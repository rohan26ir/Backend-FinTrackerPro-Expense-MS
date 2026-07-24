const Transaction = require("../models/Transaction");
const Budget = require("../models/Budget");
const Saving = require("../models/Saving");

/**
 * GET /api/reports/summary
 */
exports.getFinancialReport = async (req, res, next) => {
  try {
    const period = req.query.period || "monthly"; // monthly, quarterly, yearly
    const userId = req.user._id;

    const transactions = await Transaction.find({ user: userId }).sort({ date: -1 });

    const totalIncome = transactions
      .filter((t) => t.type === "Income")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpense = transactions
      .filter((t) => t.type === "Expense" || t.type === "Expenses")
      .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);

    const netSavings = totalIncome - totalExpense;

    // Monthly aggregation
    const monthlyMap = {};
    transactions.forEach((t) => {
      const monthKey = new Date(t.date).toLocaleString("default", { month: "short", year: "numeric" });
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, income: 0, expense: 0, net: 0 };
      }
      if (t.type === "Income") {
        monthlyMap[monthKey].income += t.amount || 0;
      } else {
        monthlyMap[monthKey].expense += Math.abs(t.amount || 0);
      }
      monthlyMap[monthKey].net = monthlyMap[monthKey].income - monthlyMap[monthKey].expense;
    });

    // Category breakdown
    const categoryMap = {};
    transactions
      .filter((t) => t.type === "Expense" || t.type === "Expenses")
      .forEach((t) => {
        const cat = t.category || "Uncategorized";
        categoryMap[cat] = (categoryMap[cat] || 0) + Math.abs(t.amount || 0);
      });

    const categoryBreakdown = Object.keys(categoryMap).map((cat) => ({
      name: cat,
      amount: categoryMap[cat],
      percentage: totalExpense > 0 ? Number(((categoryMap[cat] / totalExpense) * 100).toFixed(1)) : 0,
    }));

    const budgets = await Budget.find({ user: userId });
    const savings = await Saving.find({ user: userId });

    res.json({
      success: true,
      period,
      overview: {
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate: totalIncome > 0 ? Number(((netSavings / totalIncome) * 100).toFixed(1)) : 0,
        transactionCount: transactions.length,
      },
      monthlyTrends: Object.values(monthlyMap),
      categoryBreakdown,
      budgetsCount: budgets.length,
      savingsGoalsCount: savings.length,
    });
  } catch (err) {
    next(err);
  }
};
