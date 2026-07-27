const User = require("../models/User");
const Payment = require("../models/Payment");
const nodemailer = require("nodemailer");
const pdfGenerator = require("../utils/pdfGenerator");

const getStripeInstance = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  try {
    return require("stripe")(key);
  } catch (e) {
    console.error("Stripe SDK load error:", e.message);
    return null;
  }
};

const createMailTransport = () => {
  const host = process.env.EMAIL_HOST || process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.EMAIL_PORT || process.env.SMTP_PORT) || 587;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
    });
  }

  return nodemailer.createTransport({ jsonTransport: true });
};

const PLAN_PRICES = {
  monthly: { free: 0, pro: 9.99, premium: 19.99, enterprise: 19.99 },
  yearly: { free: 0, pro: 7.99, premium: 14.99, enterprise: 14.99 },
};

/**
 * POST /api/payments/checkout
 * Direct Stripe API Integration & Email Receipt Dispatch
 */
exports.processCheckout = async (req, res, next) => {
  try {
    const { plan, billingCycle = "yearly", promoCode, paymentMethodId } = req.body;
    const user = req.user;
    const userId = user._id;

    // 1. Admin Payment Block
    const isAdmin = user.role === "admin" || (user.email && user.email.toLowerCase() === "rohan26ir@gmail.com");
    if (isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Admins already have full unlimited access across all tiers! Payment is disabled.",
      });
    }

    const currentPlan = (user.plan || "free").toLowerCase();
    const targetPlan = (plan || "pro").toLowerCase();
    const cycle = billingCycle === "monthly" ? "monthly" : "yearly";

    // 2. Duplicate Active Plan Block
    if (currentPlan === targetPlan) {
      return res.status(400).json({
        success: false,
        message: `You are already subscribed to the ${targetPlan.toUpperCase()} plan!`,
      });
    }

    // 3. Prorated Upgrade Calculation (Target Price - Current Credit)
    const targetPrice = PLAN_PRICES[cycle][targetPlan] || 9.99;
    const currentCredit = PLAN_PRICES[cycle][currentPlan] || 0;
    let proratedAmount = Math.max(0, targetPrice - currentCredit);

    if (promoCode && (promoCode.toUpperCase() === "PROMO30" || promoCode.toUpperCase() === "SAVE30")) {
      proratedAmount = Number((proratedAmount * 0.7).toFixed(2));
    }

    const amountInCents = Math.max(50, Math.round(proratedAmount * 100)); // Stripe min 50 cents ($0.50)

    let transactionId = "";
    let stripeStatus = "succeeded";
    let stripeRawObject = null;
    const stripe = getStripeInstance();

    // 4. Call Stripe API
    if (stripe) {
      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "usd",
          payment_method: paymentMethodId || "pm_card_visa",
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: "never",
          },
          confirm: true,
          description: `DailyFinTracker Pro Upgrade (${currentPlan.toUpperCase()} -> ${targetPlan.toUpperCase()}) - ${user.email}`,
          metadata: {
            userId: userId.toString(),
            userEmail: user.email,
            fromPlan: currentPlan,
            toPlan: targetPlan,
            proratedCredit: currentCredit.toString(),
          },
        });

        if (paymentIntent && paymentIntent.id) {
          transactionId = paymentIntent.id;
          stripeStatus = paymentIntent.status || "succeeded";
          stripeRawObject = paymentIntent;
        }
      } catch (stripeErr) {
        console.error("❌ Stripe API Error:", stripeErr.message);
        return res.status(400).json({
          success: false,
          message: `Stripe API Error: ${stripeErr.message}`,
        });
      }
    } else {
      transactionId = "pi_simulated_" + Math.random().toString(36).substring(2, 12);
    }

    // Calculate Expiry Date (30 days for monthly, 365 days for yearly)
    const expiryDate = new Date(Date.now() + (cycle === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000);

    // Persist Payment Record in MongoDB
    const paymentRecord = await Payment.create({
      user: userId,
      userName: user.name || "User",
      userEmail: user.email,
      amount: Number(proratedAmount.toFixed(2)),
      currency: "USD",
      plan: targetPlan,
      billingCycle: cycle,
      stripePaymentIntentId: transactionId,
      status: stripeStatus,
      paymentMethod: "card",
    });

    // Upgrade user's subscription plan in MongoDB with expiration timestamp
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        plan: targetPlan,
        subscriptionId: transactionId,
        subscriptionStatus: "active",
        subscriptionEndDate: expiryDate,
        planExpiresAt: expiryDate,
      },
      { new: true }
    ).select("-password -refreshToken");

    // Dispatch Official HTML Email Receipt with Attached PDF via Nodemailer
    try {
      const transporter = createMailTransport();
      const fromEmail = process.env.EMAIL_FROM || `"DailyFinTracker Billing" <${process.env.EMAIL_USER}>`;

      // Generate PDF Payment Receipt Attachment Buffer
      let pdfAttachmentBuffer = null;
      try {
        pdfAttachmentBuffer = await pdfGenerator.generateReceiptPDF({
          userName: user.name,
          userEmail: user.email,
          plan: targetPlan,
          billingCycle: cycle,
          amount: Number(proratedAmount.toFixed(2)),
          currency: "USD",
          stripePaymentIntentId: transactionId,
          createdAt: new Date(),
        });
      } catch (pdfErr) {
        console.error("❌ PDF Receipt Generation Error:", pdfErr.message);
      }

      const attachments = pdfAttachmentBuffer
        ? [
            {
              filename: `DailyFinTracker_Payment_Receipt_${targetPlan.toUpperCase()}.pdf`,
              content: pdfAttachmentBuffer,
              contentType: "application/pdf",
            },
          ]
        : [];

      await transporter.sendMail({
        from: fromEmail,
        to: user.email,
        subject: `DailyFinTracker Pro — Payment Receipt & ${targetPlan.toUpperCase()} Plan Activation`,
        attachments,
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 16px; background-color: #ffffff;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; text-align: center; border-radius: 12px; color: #ffffff;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Subscription Confirmed</h2>
              <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">DailyFinTracker Pro Payment Receipt Attached</p>
            </div>
            
            <div style="padding: 24px 8px;">
              <p style="font-size: 15px;">Hello <strong>${user.name}</strong>,</p>
              
              <p style="font-size: 14px; color: #475569;">Thank you for your payment! Your account has been successfully upgraded to the <strong>${targetPlan.toUpperCase()} Plan</strong>.</p>
              <p style="font-size: 13px; color: #10b981; font-weight: bold;">📎 Your official PDF Payment Receipt is attached to this email.</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 18px; margin: 20px 0; border-radius: 12px;">
                <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Plan Tier:</td>
                    <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #10b981;">${targetPlan.toUpperCase()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Billing Cycle:</td>
                    <td style="padding: 6px 0; font-weight: bold; text-align: right; text-transform: capitalize;">${cycle}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Amount Paid:</td>
                    <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #0f172a;">$${proratedAmount.toFixed(2)} USD</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Stripe Transaction ID:</td>
                    <td style="padding: 6px 0; font-family: monospace; text-align: right; color: #475569;">${transactionId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b;">Plan Expiry Date:</td>
                    <td style="padding: 6px 0; font-weight: bold; text-align: right; color: #3b82f6;">${expiryDate.toLocaleDateString()}</td>
                  </tr>
                </table>
              </div>

              <p style="font-size: 13px; color: #64748b;">Note: Once your subscription period ends on ${expiryDate.toLocaleDateString()}, your account will automatically transition to the Free plan unless renewed.</p>
              
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />

              <p style="font-size: 13px; font-weight: 700; color: #10b981; margin: 0;">Best regards,</p>
              <p style="font-size: 13px; font-weight: 600; color: #1e293b; margin: 2px 0 0 0;">DailyFinTracker Billing Team</p>

              <div style="margin-top: 28px; padding-top: 16px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b;">
                <p style="margin: 0; font-weight: 600;">Developed by <a href="https://meetrohan.netlify.app/" target="_blank" style="color: #4f46e5; text-decoration: underline; font-weight: 700;">Rohan</a></p>
              </div>
            </div>
          </div>
        `,
      });
    } catch (mailErr) {
      console.error("Payment confirmation email dispatch failed:", mailErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Successfully upgraded to ${targetPlan.toUpperCase()} plan! Payment receipt email dispatched to ${user.email}.`,
      transactionId,
      proratedCredit: currentCredit,
      amountPaid: Number(proratedAmount.toFixed(2)),
      payment: paymentRecord,
      user: updatedUser,
      plan: targetPlan,
      planExpiresAt: expiryDate,
      stripeResponse: stripeRawObject,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payments/my-payments
 */
exports.getMyPayments = async (req, res, next) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
    res.json({
      success: true,
      data: payments.map((p) => ({ ...p, id: p._id.toString() })),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/payments/all-payments
 */
exports.getAllPayments = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === "admin" || (req.user.email && req.user.email.toLowerCase() === "rohan26ir@gmail.com");
    if (!isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied. Admin privileges required." });
    }

    const payments = await Payment.find().sort({ createdAt: -1 }).populate("user", "name email avatar").lean();
    res.json({
      success: true,
      data: payments.map((p) => ({
        ...p,
        id: p._id.toString(),
        userAvatar: (p.user && typeof p.user === "object" && p.user.avatar) ? p.user.avatar : null,
      })),
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
    const user = await User.findById(req.user._id).select("plan subscriptionStatus subscriptionEndDate planExpiresAt");
    res.json({
      success: true,
      data: {
        plan: user.plan || "free",
        status: user.subscriptionStatus || "active",
        endDate: user.subscriptionEndDate || user.planExpiresAt || null,
      },
    });
  } catch (err) {
    next(err);
  }
};
