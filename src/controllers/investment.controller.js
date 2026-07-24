const Investment = require("../models/Investment");

/**
 * GET /api/investments
 */
exports.getAll = async (req, res, next) => {
  try {
    const investments = await Investment.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    const totalInvested = investments.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
    const totalCurrentValue = investments.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
    const totalReturns = totalCurrentValue - totalInvested;
    const totalReturnsPercentage = totalInvested > 0 ? Number(((totalReturns / totalInvested) * 100).toFixed(2)) : 0;

    res.json({
      success: true,
      data: investments,
      stats: {
        totalInvested,
        totalCurrentValue,
        totalReturns,
        totalReturnsPercentage,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/investments
 */
exports.create = async (req, res, next) => {
  try {
    const { name, type, symbol, purchasePrice, currentPrice, quantity, currency, purchaseDate, notes } = req.body;

    const investment = await Investment.create({
      user: req.user._id,
      name,
      type: type || "Stocks",
      symbol: symbol ? symbol.toUpperCase() : undefined,
      purchasePrice: parseFloat(purchasePrice),
      currentPrice: parseFloat(currentPrice !== undefined ? currentPrice : purchasePrice),
      quantity: parseFloat(quantity),
      currency: currency || "USD",
      purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
      notes: notes || "",
    });

    res.status(201).json({ success: true, data: investment });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/investments/:id
 */
exports.update = async (req, res, next) => {
  try {
    const allowed = ["name", "type", "symbol", "purchasePrice", "currentPrice", "quantity", "currency", "purchaseDate", "notes"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.purchasePrice) updates.purchasePrice = parseFloat(updates.purchasePrice);
    if (updates.currentPrice) updates.currentPrice = parseFloat(updates.currentPrice);
    if (updates.quantity) updates.quantity = parseFloat(updates.quantity);
    if (updates.purchaseDate) updates.purchaseDate = new Date(updates.purchaseDate);

    const investment = await Investment.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!investment) return res.status(404).json({ success: false, message: "Investment not found" });
    res.json({ success: true, data: investment });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/investments/:id
 */
exports.remove = async (req, res, next) => {
  try {
    const investment = await Investment.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!investment) return res.status(404).json({ success: false, message: "Investment not found" });
    res.json({ success: true, message: "Investment deleted successfully" });
  } catch (err) {
    next(err);
  }
};
