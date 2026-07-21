const Transaction = require("../models/Transaction");

// ─── Helper: build date/type filter ────────────────────────────────────────
const buildFilter = (userId, query) => {
  const filter = { user: userId };
  if (query.type && ["income","expense"].includes(query.type)) filter.type = query.type;
  if (query.startDate || query.endDate) {
    filter.date = {};
    if (query.startDate) filter.date.$gte = new Date(query.startDate);
    if (query.endDate) {
      const end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }
  if (query.category) filter.category = new RegExp(query.category, "i");
  return filter;
};

const escapeCSV = (val) => {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * GET /api/export/csv
 */
exports.exportCSV = async (req, res, next) => {
  try {
    const filter = buildFilter(req.user._id, req.query);
    const transactions = await Transaction.find(filter).sort({ date: -1 }).lean();

    const headers = ["Date","Type","Amount","Currency","Category","Account","Recurrence","Tags","Note"];
    const rows = transactions.map((t) => [
      new Date(t.date).toISOString().split("T")[0],
      t.type,
      t.amount,
      t.currency,
      t.category,
      t.account || "",
      t.recurrence || "None",
      (t.tags || []).join(";"),
      t.note || "",
    ].map(escapeCSV).join(","));

    const csv = [headers.join(","), ...rows].join("\r\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="fintracker-export-${Date.now()}.csv"`);
    res.send("\uFEFF" + csv); // BOM for Excel compatibility
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/export/json
 */
exports.exportJSON = async (req, res, next) => {
  try {
    const filter = buildFilter(req.user._id, req.query);
    const transactions = await Transaction.find(filter).sort({ date: -1 }).lean();

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId: req.user._id,
      totalRecords: transactions.length,
      transactions: transactions.map(({ _id, user, isDeleted, __v, ...t }) => t),
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="fintracker-export-${Date.now()}.json"`);
    res.json(exportData);
  } catch (err) {
    next(err);
  }
};
