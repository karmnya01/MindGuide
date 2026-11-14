const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../model/User");

/**
 * Creates a Stripe Checkout Session for a subscription upgrade.
 * @param {string} userId - The ID of the user.
 * @param {string} priceId - The Stripe Price ID for the selected tier.
 * @param {string} email - The user's email.
 * @returns {Promise<Object>} - The created checkout session.
 */
async function createCheckoutSession(userId, priceId, email) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/upgrade/cancel`,
      metadata: { userId },
      subscription_data: { trial_period_days: 7 },
    });
    return session;
  } catch (error) {
    console.error("Stripe Checkout Session Error:", error.message);
    throw error;
  }
}

/**
 * Handles incoming Stripe Webhook events.
 * @param {Object} event - The Stripe webhook event object.
 */
async function handleWebhook(event) {
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata.userId;
        // Set expiry to 30 days from now (basic implementation)
        await User.findByIdAndUpdate(userId, {
          subscriptionTier: "pro",
          subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
        });
        // console.log(`[Stripe] Pro unlock successful for user ${userId}`);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await User.findOneAndUpdate(
          { stripeSubscriptionId: subscription.id },
          { subscriptionTier: "free", subscriptionExpiry: null }
        );
        // console.log(`[Stripe] Subscription deleted for ${subscription.id}`);
        break;
      }
      case "invoice.payment_failed": {
        // Logic to notify user about failed payment
        console.warn(`[Stripe] Payment failed for ${event.data.object.customer}`);
        break;
      }
      default:
        // console.log(`[Stripe] Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("Stripe Webhook Handler Error:", error.message);
    throw error;
  }
}

/**
 * Creates a link to the Stripe Customer Portal for managing subscriptions.
 * @param {string} stripeCustomerId - The Stripe Customer ID.
 * @returns {Promise<string>} - The portal session URL.
 */
async function createPortalSession(stripeCustomerId) {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}/account/dashboard/profile`,
    });
    return session.url;
  } catch (error) {
    console.error("Stripe Portal Session Error:", error.message);
    throw error;
  }
}

module.exports = {
  createCheckoutSession,
  handleWebhook,
  createPortalSession,
};
