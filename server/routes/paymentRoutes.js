const express = require("express");
const router = express.Router();
const { protectCookie } = require("../middleware/authMiddleware");
const {
  createCheckoutSession,
  handleWebhook,
  createPortalSession,
} = require("../services/stripeService");
const User = require("../model/User");
const asyncHandler = require("express-async-handler");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// 0. GET CONFIG (Price IDs)
router.get(
  "/config",
  protectCookie,
  asyncHandler(async (req, res) => {
    res.status(200).json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      proMonthlyPriceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      enterprisePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    });
  })
);

// 1. CREATE CHECKOUT SESSION
router.post(
  "/create-checkout",
  protectCookie,
  asyncHandler(async (req, res) => {
    const { priceId } = req.body;
    if (!priceId) {
      res.status(400);
      throw new Error("PriceId is required");
    }
    const session = await createCheckoutSession(
      req.user._id,
      priceId,
      req.user.email
    );
    res.status(200).json({ url: session.url });
  })
);

// 2. STRIPE WEBHOOK (Special handling for raw body)
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  asyncHandler(async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    await handleWebhook(event);
    res.status(200).json({ received: true });
  })
);

// 3. CUSTOMER PORTAL
router.get(
  "/portal",
  protectCookie,
  asyncHandler(async (req, res) => {
    if (!req.user.stripeCustomerId) {
      res.status(400);
      throw new Error("No Stripe customer found for this user");
    }
    const portalUrl = await createPortalSession(req.user.stripeCustomerId);
    res.status(200).json({ url: portalUrl });
  })
);

// 4. GET SUBSCRIPTION STATUS
router.get(
  "/status",
  protectCookie,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select(
      "subscriptionTier subscriptionExpiry"
    );
    res.status(200).json({
      tier: user.subscriptionTier,
      expiry: user.subscriptionExpiry,
      isPro: user.subscriptionTier === "pro",
    });
  })
);

module.exports = router;
