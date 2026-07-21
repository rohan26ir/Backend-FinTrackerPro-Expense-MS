const Saving = require("../models/Saving");

/**
 * GET /api/savings
 */
exports.getAll = async (req, res, next) => {
  try {
    const savings = await Saving.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    // Attach progress virtual manually (lean() skips virtuals)
    const data = savings.map((s) => ({
      ...s,
      progress: s.targetAmount ? Math.min(100, Math.round((s.currentAmount / s.targetAmount) * 100)) : 0,
    }));
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/savings
 */
exports.create = async (req, res, next) => {
  try {
    const { name, targetAmount, currency, deadline, icon, color, description } = req.body;

    const saving = await Saving.create({
      user: req.user._id,
      name,
      targetAmount: parseFloat(targetAmount),
      currency: currency || "BDT",
      deadline: deadline ? new Date(deadline) : undefined,
      icon: icon || "PiggyBank",
      color: color || "#4ADE80",
      description: description || "",
    });

    res.status(201).json({ success: true, data: saving });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/savings/:id
 * Also supports: { contribute: amount } to add to currentAmount
 */
exports.update = async (req, res, next) => {
  try {
    const allowed = ["name", "targetAmount", "currency", "deadline", "icon", "color", "description", "isCompleted"];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    if (updates.targetAmount) updates.targetAmount = parseFloat(updates.targetAmount);
    if (updates.deadline) updates.deadline = new Date(updates.deadline);

    // Handle contribution (add to currentAmount)
    if (req.body.contribute) {
      const contribution = parseFloat(req.body.contribute);
      if (isNaN(contribution) || contribution <= 0) {
        return res.status(400).json({ success: false, message: "Invalid contribution amount" });
      }
      const saving = await Saving.findOne({ _id: req.params.id, user: req.user._id });
      if (!saving) return res.status(404).json({ success: false, message: "Savings goal not found" });

      saving.currentAmount = Math.min(saving.targetAmount, saving.currentAmount + contribution);
      if (saving.currentAmount >= saving.targetAmount) saving.isCompleted = true;
      await saving.save();
      return res.json({ success: true, data: saving });
    }

    const saving = await Saving.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!saving) return res.status(404).json({ success: false, message: "Savings goal not found" });
    res.json({ success: true, data: saving });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/savings/:id
 */
exports.remove = async (req, res, next) => {
  try {
    const saving = await Saving.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!saving) return res.status(404).json({ success: false, message: "Savings goal not found" });
    res.json({ success: true, message: "Savings goal deleted" });
  } catch (err) {
    next(err);
  }
};
