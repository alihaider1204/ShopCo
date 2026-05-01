import { createHash, randomBytes } from "crypto";
import Stripe from "stripe";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { sendOrderConfirmationEmail } from "../services/emailService.js";
import { recordCouponRedemption } from "./couponApply.js";

export function hashGuestToken(plain) {
  return createHash("sha256").update(String(plain)).digest("hex");
}

export function generateGuestCheckoutSecret() {
  const plain = randomBytes(32).toString("hex");
  const hash = hashGuestToken(plain);
  return { plain, hash };
}

export function guestTokenMatches(order, plainToken) {
  if (!order.isGuest || !order.guestCheckoutTokenHash || !plainToken) return false;
  return hashGuestToken(plainToken) === order.guestCheckoutTokenHash;
}

/** @param {Array<{ product: import('mongoose').Types.ObjectId, qty: number }>} orderItems */
export async function validateStockForOrderItems(orderItems) {
  for (const item of orderItems) {
    const p = await Product.findById(item.product).select("countInStock name");
    if (!p) {
      const err = new Error("One or more products are no longer available");
      err.statusCode = 400;
      throw err;
    }
    if (p.countInStock < item.qty) {
      const err = new Error(
        `Not enough stock for "${p.name}". Available: ${p.countInStock}, requested: ${item.qty}.`
      );
      err.statusCode = 400;
      throw err;
    }
  }
}

/**
 * Decrement stock once per order (idempotent via order.inventoryAdjusted).
 * @param {import('mongoose').Document} order
 */
export async function decrementInventoryForOrder(order) {
  if (order.inventoryAdjusted) return;

  for (const item of order.orderItems) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.product, countInStock: { $gte: item.qty } },
      { $inc: { countInStock: -item.qty } },
      { new: true }
    );
    if (!updated) {
      console.error(
        `[inventory] Could not decrement stock for product ${item.product} on order ${order._id} — check manually`
      );
    }
  }
  order.inventoryAdjusted = true;
  await order.save();
}

/**
 * Restore stock once for a canceled order (idempotent via order.inventoryAdjusted).
 * @param {import('mongoose').Document} order
 */
export async function restoreInventoryForOrder(order) {
  if (!order.inventoryAdjusted) return;

  for (const item of order.orderItems) {
    await Product.findByIdAndUpdate(item.product, { $inc: { countInStock: item.qty } });
  }
  order.inventoryAdjusted = false;
  await order.save();
}

export function emailRecipientFromOrder(order, fallbackUserEmail) {
  const u = order.user;
  if (u && typeof u === "object" && "email" in u && u.email) {
    return {
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      email: u.email,
    };
  }
  const full = order.shippingAddress?.fullName || "Guest";
  const parts = full.trim().split(/\s+/);
  return {
    firstName: parts[0] || "Guest",
    lastName: parts.slice(1).join(" ") || "",
    email: order.guestEmail || order.receiptEmail || fallbackUserEmail || "",
  };
}

/**
 * Apply succeeded PaymentIntent to order: paid flags, inventory, confirmation email (idempotent).
 * @param {string} orderId
 * @param {import('stripe').Stripe} stripe
 * @param {import('stripe').Stripe.PaymentIntent} pi
 * @param {string} [fallbackEmail] — account email when populating user missing
 */
export async function applyPaymentIntentSuccess(orderId, stripe, pi, fallbackEmail = "") {
  const order = await Order.findById(orderId);
  if (!order) {
    const err = new Error("Order not found");
    err.statusCode = 404;
    throw err;
  }

  if (pi.metadata?.orderId && pi.metadata.orderId !== String(order._id)) {
    const err = new Error("Payment does not match this order");
    err.statusCode = 400;
    throw err;
  }

  if (pi.status !== "succeeded") {
    return Order.findById(order._id).populate("user", "firstName lastName email");
  }

  if (order.isPaid) {
    return Order.findById(order._id).populate("user", "firstName lastName email");
  }

  order.isPaid = true;
  order.paidAt = new Date();
  order.paymentStatus = "paid";

  let receiptUrl;
  const charge = pi.latest_charge;
  if (charge && typeof charge === "object") {
    receiptUrl = charge.receipt_url;
  } else if (typeof charge === "string") {
    try {
      const ch = await stripe.charges.retrieve(charge);
      receiptUrl = ch.receipt_url;
    } catch {
      /* optional */
    }
  }

  order.paymentResult = {
    id: pi.id,
    status: pi.status,
    update_time: new Date().toISOString(),
    email_address: pi.receipt_email || order.receiptEmail || order.guestEmail || fallbackEmail,
    receipt_url: receiptUrl || undefined,
  };

  await order.save();
  await decrementInventoryForOrder(order);
  await recordCouponRedemption(order);

  let populated = await Order.findById(order._id).populate("user", "firstName lastName email");
  const doc = populated;

  if (!doc.confirmationEmailSent) {
    let userPayload = emailRecipientFromOrder(doc, fallbackEmail);
    if (!userPayload.email && doc.user?._id) {
      const u = await User.findById(doc.user._id).select("firstName lastName email").lean();
      if (u) userPayload = { ...u, email: doc.receiptEmail || u.email };
    }
    if (userPayload.email) {
      const sent = await sendOrderConfirmationEmail(doc, userPayload);
      if (sent) {
        doc.confirmationEmailSent = true;
        await doc.save();
      }
    }
  }

  populated = await Order.findById(order._id).populate("user", "firstName lastName email");
  return populated;
}

export function getStripeClient() {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return null;
  return new Stripe(secret);
}
