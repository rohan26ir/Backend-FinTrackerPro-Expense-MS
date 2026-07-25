const Card = require("../models/Card");

/**
 * GET /api/cards
 */
exports.getAll = async (req, res, next) => {
  try {
    const cards = await Card.find({ user: req.user._id }).sort({ isDefault: -1, createdAt: -1 }).lean();
    const mapped = cards.map((c) => ({
      ...c,
      id: c._id.toString(),
      cardName: c.cardName || c.label || "My Card",
      cardNumber: c.cardNumber || (c.last4 ? `**** ${c.last4}` : "**** 4821"),
      expiryDate: c.expiryDate || "12/28",
      cardType: c.cardType || "Visa",
      limit: c.limit || c.balance || 5000,
      used: c.used || 0,
      status: c.status || "Active",
    }));
    res.json({ success: true, data: mapped });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/cards
 */
exports.create = async (req, res, next) => {
  try {
    const { cardName, label, cardNumber, last4, expiryDate, cardType, limit, used, status, type, bank, color, balance, currency, isDefault } = req.body;

    if (isDefault) {
      await Card.updateMany({ user: req.user._id }, { isDefault: false });
    }

    const cardLabel = cardName || label || "My Card";
    const num = cardNumber || last4 || "";
    const extractedLast4 = num ? num.replace(/\D/g, "").slice(-4) : "4821";

    const card = await Card.create({
      user: req.user._id,
      label: cardLabel,
      cardName: cardLabel,
      cardNumber: cardNumber || (extractedLast4 ? `**** ${extractedLast4}` : "**** 4821"),
      expiryDate: expiryDate || "12/28",
      cardType: cardType || "Visa",
      limit: limit ? parseFloat(limit) : balance ? parseFloat(balance) : 5000,
      used: used ? parseFloat(used) : 0,
      status: status || "Active",
      type: type || "debit",
      last4: extractedLast4,
      bank: bank || "",
      color: color || "#6366F1",
      balance: limit ? parseFloat(limit) : balance ? parseFloat(balance) : 5000,
      currency: currency || "USD",
      isDefault: !!isDefault,
    });

    res.status(201).json({
      success: true,
      data: {
        ...card.toObject(),
        id: card._id.toString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/cards/:id
 */
exports.update = async (req, res, next) => {
  try {
    const allowed = ["label", "cardName", "cardNumber", "expiryDate", "cardType", "limit", "used", "status", "type", "last4", "bank", "color", "balance", "currency", "isDefault"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.cardName && !updates.label) updates.label = updates.cardName;

    const card = await Card.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!card) return res.status(404).json({ success: false, message: "Card not found" });
    res.json({
      success: true,
      data: {
        ...card.toObject(),
        id: card._id.toString(),
      },
    });
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
