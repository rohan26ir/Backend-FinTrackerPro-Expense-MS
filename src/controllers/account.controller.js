const Account = require("../models/Account");

/**
 * GET /api/accounts
 * Fetch all active accounts belonging to the authenticated user.
 * If user has no accounts yet, seed default initial accounts.
 */
exports.getAll = async (req, res, next) => {
  try {
    const userId = req.user._id;
    let accounts = await Account.find({ user: userId, isDeleted: false }).sort({ createdAt: 1 }).lean();

    // Auto-seed default accounts for new users if they have none
    if (accounts.length === 0) {
      const defaults = [
        {
          user: userId,
          name: "Primary Checking & Savings",
          accountNumber: "4821 9801 2345 7890",
          balance: 8450.0,
          type: "savings",
        },
        {
          user: userId,
          name: "Investment Portfolio",
          accountNumber: "INV-8830192",
          balance: 14200.5,
          type: "investment",
        },
      ];

      const created = await Account.insertMany(defaults);
      accounts = created.map((a) => a.toObject());
    }

    const mapped = accounts.map((a) => ({
      ...a,
      id: a._id.toString(),
    }));

    res.json({ success: true, data: mapped });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/accounts
 * Create a new account for the authenticated user.
 */
exports.create = async (req, res, next) => {
  try {
    const { name, accountNumber, balance, type, currency } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Account name is required" });
    }

    const account = await Account.create({
      user: req.user._id,
      name: name.trim(),
      accountNumber: accountNumber ? accountNumber.trim() : "",
      balance: parseFloat(balance) || 0,
      type: type || "savings",
      currency: currency || "USD",
    });

    res.status(201).json({
      success: true,
      data: {
        ...account.toObject(),
        id: account._id.toString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/accounts/:id
 */
exports.getOne = async (req, res, next) => {
  try {
    const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }
    res.json({
      success: true,
      data: {
        ...account.toObject(),
        id: account._id.toString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/accounts/:id
 * Update an existing account owned by the user.
 */
exports.update = async (req, res, next) => {
  try {
    const allowed = ["name", "accountNumber", "balance", "type", "currency"];
    const updates = {};

    allowed.forEach((k) => {
      if (req.body[k] !== undefined) {
        if (k === "name") updates[k] = req.body[k].trim();
        else if (k === "balance") updates[k] = parseFloat(req.body[k]) || 0;
        else updates[k] = req.body[k];
      }
    });

    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, isDeleted: false },
      updates,
      { new: true, runValidators: true }
    );

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found or unauthorized" });
    }

    res.json({
      success: true,
      data: {
        ...account.toObject(),
        id: account._id.toString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/accounts/:id
 * Soft delete an account owned by the user.
 */
exports.remove = async (req, res, next) => {
  try {
    const account = await Account.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );

    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found or unauthorized" });
    }

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    next(err);
  }
};
