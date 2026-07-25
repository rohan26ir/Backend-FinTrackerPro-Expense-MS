const TaxDeduction = require("../models/TaxDeduction");
const Transaction = require("../models/Transaction");

/**
 * GET /api/tax
 */
exports.getTaxOverview = async (req, res, next) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();

    const deductions = await TaxDeduction.find({ user: req.user._id, taxYear: year })
      .sort({ date: -1 });

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const incomeTransactions = await Transaction.find({
      user: req.user._id,
      type: { $in: ["income", "Income"] },
      date: { $gte: startDate, $lte: endDate },
    });

    const totalIncome = incomeTransactions.reduce((acc, t) => acc + (t.amount || 0), 0);
    const totalDeductions = deductions.reduce((acc, d) => acc + (d.amount || 0), 0);
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);

    // Simple progressive tax bracket calculation estimation
    let estimatedTax = 0;
    if (taxableIncome > 500000) {
      estimatedTax = (taxableIncome - 500000) * 0.25 + 30000;
    } else if (taxableIncome > 300000) {
      estimatedTax = (taxableIncome - 300000) * 0.15 + 10000;
    } else if (taxableIncome > 100000) {
      estimatedTax = (taxableIncome - 100000) * 0.05;
    }

    res.json({
      success: true,
      taxYear: year,
      summary: {
        totalIncome,
        totalDeductions,
        taxableIncome,
        estimatedTax: Math.round(estimatedTax),
        effectiveTaxRate: totalIncome > 0 ? Number(((estimatedTax / totalIncome) * 100).toFixed(1)) : 0,
      },
      deductions,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/tax/deductions
 */
exports.addDeduction = async (req, res, next) => {
  try {
    const { title, category, amount, taxYear, date, receiptNumber, notes } = req.body;

    const deduction = await TaxDeduction.create({
      user: req.user._id,
      title,
      category: category || "Other",
      amount: parseFloat(amount),
      taxYear: taxYear ? parseInt(taxYear) : new Date().getFullYear(),
      date: date ? new Date(date) : undefined,
      receiptNumber: receiptNumber || "",
      notes: notes || "",
    });

    res.status(201).json({ success: true, data: deduction });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/tax/deductions/:id
 */
exports.removeDeduction = async (req, res, next) => {
  try {
    const deduction = await TaxDeduction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deduction) return res.status(404).json({ success: false, message: "Deduction not found" });
    res.json({ success: true, message: "Tax deduction removed successfully" });
  } catch (err) {
    next(err);
  }
};
