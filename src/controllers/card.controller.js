const Card = require("../models/Card");

/**
 * GET /api/cards
 */
exports.getAll = async (req, res, next) => {
  try {
    const cards = await Card.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 }).lean();
    res.json({ success: true, data: cards });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/cards
 */
exports.create = async (req, res, next) => {
  try {
    const { label, type, last4, bank, color, balance, currency, isDefault } = req.body;

    if (isDefault) {
      // Unset current default
      await Card.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const card = await Card.create({
      user: req.user._id,
      label,
      type: type || "debit",
      last4: last4 || "",
      bank: bank || "",
      color: color || "#6366F1",
      balance: balance ? parseFloat(balance) : 0,
      currency: currency || "BDT",
      isDefault: !!isDefault,
    });

    res.status(201).json({ success: true, data: card });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/cards/:id
 */
exports.update = async (req, res, next) => {
  try {
    const allowed = ["label", "type", "last4", "bank", "color", "balance", "currency", "isDefault"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.balance !== undefined) updates.balance = parseFloat(updates.balance);

    if (updates.isDefault) {
      await Card.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const card = await Card.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!card) return res.status(404).json({ success: false, message: "Card not found" });
    res.json({ success: true, data: card });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/cards/:id
 */
exports.remove = async (req, res, next) => {
  try {
    const card = await Card.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!card) return res.status(404).json({ success: false, message: "Card not found" });
    res.json({ success: true, message: "Card deleted" });
  } catch (err) {
    next(err);
  }
};
