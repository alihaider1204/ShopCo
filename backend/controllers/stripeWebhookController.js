import { applyPaymentIntentSuccess, getStripeClient } from "../utils/orderFulfillment.js";

/**
 * POST /api/payment/webhook
 * Requires raw body (registered in server.js before express.json).
 */
export async function stripeWebhook(req, res) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripe = getStripeClient();

  if (!stripe || !secret) {
    console.warn("[stripe webhook] STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET missing — webhook disabled");
    return res.status(503).send("Webhook not configured");
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    return res.status(400).send("Missing stripe-signature");
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error("[stripe webhook] signature:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object;
    const orderId = pi.metadata?.orderId;
    if (orderId) {
      try {
        await applyPaymentIntentSuccess(orderId, stripe, pi, "");
      } catch (e) {
        console.error("[stripe webhook] fulfill failed:", e.message);
      }
    }
  }

  res.json({ received: true });
}
