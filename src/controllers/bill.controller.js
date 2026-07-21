// src/controller/bill.controller.js

const Bill = require("../models/Bill");

/**
 * GET /api/bills?filter=upcoming|overdue|paid|all
 */
exports.getAll = async (req, res, next) => {
  try {
    const filter = { user: req.user._id };
    const now = new Date();

    if (req.query.filter === "upcoming") {
      filter.dueDate = { $gte: now };
      filter.isPaid = false;
    } else if (req.query.filter === "overdue") {
      filter.dueDate = { $lt: now };
      filter.isPaid = false;
    } else if (req.query.filter === "paid") {
      filter.isPaid = true;
    }

    const bills = await Bill.find(filter).sort({ dueDate: 1 }).lean();
    res.json({ success: true, data: bills });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/bills
 */
exports.create = async (req, res, next) => {
  try {
    const { name, amount, currency, category, dueDate, recurrence, reminderDaysBefore, note, icon, color } = req.body;

    const bill = await Bill.create({
      user: req.user._id,
      name,
      amount: parseFloat(amount),
      currency: currency || "BDT",
      category: category || "Utilities",
      dueDate: new Date(dueDate),
      recurrence: recurrence || "Monthly",
      reminderDaysBefore: reminderDaysBefore ?? 3,
      note: note || "",
      icon: icon || "Bell",
      color: color || "#F87171",
    });

    res.status(201).json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/bills/:id
 * Also supports: { markPaid: true } to mark as paid
 */
exports.update = async (req, res, next) => {
  try {
    const allowed = ["name", "amount", "currency", "category", "dueDate", "recurrence",
                     "reminderDaysBefore", "note", "icon", "color", "isPaid"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.amount) updates.amount = parseFloat(updates.amount);
    if (updates.dueDate) updates.dueDate = new Date(updates.dueDate);

    // Mark paid shorthand
    if (req.body.markPaid) {
      updates.isPaid = true;
      updates.paidAt = new Date();
    }

    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });
    res.json({ success: true, data: bill });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/bills/:id
 */
exports.remove = async (req, res, next) => {
  try {
    const bill = await Bill.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!bill) return res.status(404).json({ success: false, message: "Bill not found" });
    res.json({ success: true, message: "Bill deleted" });
  } catch (err) {
    next(err);
  }
};
