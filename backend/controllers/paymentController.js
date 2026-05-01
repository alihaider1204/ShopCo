import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import { getStripeClient, guestTokenMatches } from "../utils/orderFulfillment.js";

async function attachPaymentIntentToOrder(order, stripe, receiptEmail, currency = "usd") {
  const amountCents = Math.round(Number(order.totalPrice) * 100);
  if (!Number.isFinite(amountCents) || amountCents < 50) {
    const err = new Error("Invalid order total for payment");
    err.statusCode = 400;
    throw err;
  }

  const cur = String(currency || "usd").toLowerCase();

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: cur,
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderId: String(order._id),
      userId: order.user ? String(order.user) : "guest",
    },
    receipt_email: receiptEmail || undefined,
    description: `Order ${order._id}`,
  });

  order.stripePaymentIntentId = paymentIntent.id;
  order.paymentStatus = "pending";
  await order.save();

  return paymentIntent;
}

// @desc    Create Stripe PaymentIntent (logged-in user)
// @route   POST /api/payment/create-payment-intent
export const createPaymentIntent = asyncHandler(async (req, res) => {
  const stripe = getStripeClient();
  if (!stripe) {
    res.status(503);
    throw new Error("Payment processing is not configured. Add STRIPE_SECRET_KEY to .env");
  }

  const { orderId, currency = "usd" } = req.body;
  if (!orderId) {
    res.status(400);
    throw new Error("Order ID is required");
  }

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (order.isGuest || !order.user) {
    res.status(400);
    throw new Error("Use guest payment intent for guest orders");
  }
  if (String(order.user) !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized for this order");
  }
  if (order.isPaid) {
    res.status(400);
    throw new Error("Order is already paid");
  }

  try {
    const paymentIntent = await attachPaymentIntentToOrder(
      order,
      stripe,
      req.user.email,
      currency
    );
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("[Stripe] createPaymentIntent:", error.message);
    res.status(500);
    throw new Error(error.message || "Stripe payment intent creation failed");
  }
});

// @desc    Create PaymentIntent for guest order
// @route   POST /api/payment/create-payment-intent-guest
export const createGuestPaymentIntent = asyncHandler(async (req, res) => {
  const stripe = getStripeClient();
  if (!stripe) {
    res.status(503);
    throw new Error("Payment processing is not configured. Add STRIPE_SECRET_KEY to .env");
  }

  const { orderId, guestToken, currency = "usd" } = req.body;
  if (!orderId || !guestToken) {
    res.status(400);
    throw new Error("Order ID and guest token are required");
  }

  const order = await Order.findById(orderId);
  if (!order || !order.isGuest) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!guestTokenMatches(order, guestToken)) {
    res.status(403);
    throw new Error("Not authorized for this order");
  }
  if (order.isPaid) {
    res.status(400);
    throw new Error("Order is already paid");
  }

  try {
    const paymentIntent = await attachPaymentIntentToOrder(
      order,
      stripe,
      order.guestEmail || order.receiptEmail,
      currency
    );
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("[Stripe] createGuestPaymentIntent:", error.message);
    res.status(500);
    throw new Error(error.message || "Stripe payment intent creation failed");
  }
});
