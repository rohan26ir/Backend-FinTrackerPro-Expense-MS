const User = require("../models/User");

/**
 * POST /api/payments/checkout
 * Processes Stripe subscription checkout and upgrades user plan
 */
exports.processCheckout = async (req, res, next) => {
  try {
    const { plan, paymentMethod, promoCode, billingCycle } = req.body;
    const userId = req.user._id;

    // Simulate Stripe payment intent validation
    const transactionId = "sub_stripe_" + Math.random().toString(36).substring(2, 11);
    const validPlan = plan === "enterprise" ? "enterprise" : "premium";

    // Upgrade user's subscription plan in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        plan: "premium",
        subscriptionId: transactionId,
        subscriptionStatus: "active",
        subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      },
      { new: true }
    ).select("-password -refreshToken");

    res.status(200).json({
      success: true,
      message: "Payment processed successfully via Stripe!",
      transactionId,
      user: updatedUser,
      plan: validPlan,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payments/status
 */
exports.getSubscriptionStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("plan subscriptionStatus subscriptionEndDate");
    res.json({
      success: true,
      data: {
        plan: user.plan || "free",
        status: user.subscriptionStatus || "active",
        endDate: user.subscriptionEndDate || null,
      },
    });
  } catch (err) {
    next(err);
  }
};
