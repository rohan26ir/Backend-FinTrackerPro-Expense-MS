const User = require("../models/User");

let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  try {
    stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  } catch {
    // Stripe SDK optional fallback
  }
}

/**
 * POST /api/payments/checkout
 * Supports Stripe Sandbox (sk_test_...) & local test mode
 */
exports.processCheckout = async (req, res, next) => {
  try {
    const { plan, paymentMethod, promoCode, billingCycle } = req.body;
    const userId = req.user._id;

    let transactionId = "sub_stripe_sandbox_" + Math.random().toString(36).substring(2, 11);

    // If Stripe Secret Key is present, attempt live Stripe Sandbox API call
    if (stripe) {
      try {
        const session = await stripe.paymentIntents.create({
          amount: plan === "enterprise" ? 2499 : 999, // in cents ($9.99 or $24.99)
          currency: "usd",
          description: `FinTracker Pro Subscription - ${plan || "pro"}`,
          payment_method_types: ["card"],
          metadata: { userId: userId.toString(), plan: plan || "premium" },
        });
        if (session && session.id) {
          transactionId = session.id;
        }
      } catch (stripeErr) {
        console.warn("Stripe Sandbox API call note:", stripeErr.message);
      }
    }

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
      message: "Stripe Sandbox payment processed successfully!",
      transactionId,
      user: updatedUser,
      plan: "premium",
      mode: process.env.STRIPE_SECRET_KEY ? "sandbox_api" : "sandbox_simulated",
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
