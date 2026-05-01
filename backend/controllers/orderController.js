import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { buildInvoiceHtml } from "../utils/emailTemplates.js";
import {
  validateStockForOrderItems,
  applyPaymentIntentSuccess,
  guestTokenMatches,
  generateGuestCheckoutSecret,
  getStripeClient,
  decrementInventoryForOrder,
  restoreInventoryForOrder,
  emailRecipientFromOrder,
} from "../utils/orderFulfillment.js";
import {
  computeDiscountAmount,
  loadActiveCouponForCheckout,
  recordCouponRedemption,
} from "../utils/couponApply.js";

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const orderUserIdString = (order) => {
  const u = order.user;
  if (u == null) return null;
  if (typeof u === "object" && u._id != null) return String(u._id);
  return String(u);
};

const assertOrderOwner = (order, req) => {
  if (order.isGuest) return false;
  if (!req.user?._id) return false;
  const oid = orderUserIdString(order);
  if (!oid) return false;
  return oid === String(req.user._id);
};

// @desc    Create new order (logged-in; unpaid until Stripe confirms)
// @route   POST /api/orders
export const addOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice: _clientTotal,
    receiptEmail,
    couponCode: couponCodeRaw,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
  }

  await validateStockForOrderItems(orderItems);

  const itemsPriceSubtotal = Number(itemsPrice);
  const t = Number(taxPrice) || 0;
  const s = Number(shippingPrice) || 0;
  if (!Number.isFinite(itemsPriceSubtotal) || itemsPriceSubtotal < 0) {
    res.status(400);
    throw new Error("Invalid items price");
  }

  let discountAmount = 0;
  let couponCode;
  if (couponCodeRaw) {
    const coupon = await loadActiveCouponForCheckout(couponCodeRaw);
    discountAmount = computeDiscountAmount(coupon, itemsPriceSubtotal);
    couponCode = coupon.code;
  }

  const totalPrice = Math.round((itemsPriceSubtotal - discountAmount + t + s) * 100) / 100;
  if (!Number.isFinite(totalPrice) || totalPrice < 0.5) {
    res.status(400);
    throw new Error("Order total must be at least $0.50 for card payments");
  }

  const order = new Order({
    orderItems,
    user: req.user._id,
    isGuest: false,
    shippingAddress,
    paymentMethod: paymentMethod || "Stripe",
    itemsPrice: itemsPriceSubtotal - discountAmount,
    itemsPriceSubtotal,
    taxPrice: t,
    shippingPrice: s,
    totalPrice,
    discountAmount,
    couponCode,
    receiptEmail: receiptEmail?.trim()?.toLowerCase() || undefined,
    isPaid: false,
    paidAt: undefined,
    paymentStatus: "pending",
  });
  const createdOrder = await order.save();
  res.status(201).json(createdOrder);
});

// @desc    Guest checkout — create order (returns guestCheckoutToken once)
// @route   POST /api/orders/guest
export const addGuestOrderItems = asyncHandler(async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice: _clientTotal,
    receiptEmail,
    guestEmail,
    couponCode: couponCodeRaw,
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    res.status(400);
    throw new Error("No order items");
  }
  const ge = String(guestEmail || "").trim().toLowerCase();
  if (!ge || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ge)) {
    res.status(400);
    throw new Error("Valid email is required for guest checkout");
  }

  await validateStockForOrderItems(orderItems);

  const itemsPriceSubtotal = Number(itemsPrice);
  const t = Number(taxPrice) || 0;
  const ship = Number(shippingPrice) || 0;
  if (!Number.isFinite(itemsPriceSubtotal) || itemsPriceSubtotal < 0) {
    res.status(400);
    throw new Error("Invalid items price");
  }

  let discountAmount = 0;
  let couponCode;
  if (couponCodeRaw) {
    const coupon = await loadActiveCouponForCheckout(couponCodeRaw);
    discountAmount = computeDiscountAmount(coupon, itemsPriceSubtotal);
    couponCode = coupon.code;
  }

  const totalPrice = Math.round((itemsPriceSubtotal - discountAmount + t + ship) * 100) / 100;
  if (!Number.isFinite(totalPrice) || totalPrice < 0.5) {
    res.status(400);
    throw new Error("Order total must be at least $0.50 for card payments");
  }

  const { plain, hash } = generateGuestCheckoutSecret();

  const order = new Order({
    isGuest: true,
    guestEmail: ge,
    guestCheckoutTokenHash: hash,
    receiptEmail: (receiptEmail && String(receiptEmail).trim().toLowerCase()) || ge,
    orderItems,
    shippingAddress,
    paymentMethod: paymentMethod || "Stripe",
    itemsPrice: itemsPriceSubtotal - discountAmount,
    itemsPriceSubtotal,
    taxPrice: t,
    shippingPrice: ship,
    totalPrice,
    discountAmount,
    couponCode,
    isPaid: false,
    paymentStatus: "pending",
  });
  await order.save();

  const out = order.toObject();
  delete out.guestCheckoutTokenHash;
  res.status(201).json({ ...out, guestCheckoutToken: plain });
});

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// @desc    Get guest order (requires guestToken query)
// @route   GET /api/orders/guest/:id
export const getGuestOrderById = asyncHandler(async (req, res) => {
  const guestToken = (req.query.guestToken || "").trim();
  const order = await Order.findById(req.params.id);
  if (!order || !order.isGuest) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!guestTokenMatches(order, guestToken)) {
    res.status(403);
    throw new Error("Not authorized");
  }
  res.json(order);
});

// @desc    Get order by ID (account holder)
// @route   GET /api/orders/:id
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "firstName lastName email");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!assertOrderOwner(order, req)) {
    res.status(403);
    throw new Error("Not authorized to view this order");
  }
  res.json(order);
});

// @desc    Sync Stripe PaymentIntent → mark paid + inventory + email (idempotent)
// @route   POST /api/orders/:id/sync-payment
export const syncOrderPayment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!assertOrderOwner(order, req)) {
    res.status(403);
    throw new Error("Not authorized");
  }

  if (order.isPaid) {
    const fresh = await Order.findById(order._id).populate("user", "firstName lastName email");
    return res.json(fresh);
  }

  const stripe = getStripeClient();
  if (!stripe) {
    res.status(503);
    throw new Error("Stripe is not configured");
  }
  if (!order.stripePaymentIntentId) {
    res.status(400);
    throw new Error("No payment was started for this order");
  }

  let pi;
  try {
    pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId, {
      expand: ["latest_charge"],
    });
  } catch (e) {
    res.status(502);
    throw new Error("Could not verify payment with Stripe");
  }

  if (pi.metadata?.orderId && pi.metadata.orderId !== String(order._id)) {
    res.status(400);
    throw new Error("Payment does not match this order");
  }

  if (pi.status === "succeeded") {
    const result = await applyPaymentIntentSuccess(order._id, stripe, pi, req.user.email);
    return res.json(result);
  }

  if (pi.status === "canceled") {
    order.paymentStatus = "canceled";
    await order.save();
  } else {
    order.paymentStatus = "pending";
    await order.save();
  }

  const fresh = await Order.findById(order._id).populate("user", "firstName lastName email");
  res.json(fresh);
});

// @desc    Sync payment for guest order
// @route   POST /api/orders/:id/sync-payment-guest
export const syncGuestOrderPayment = asyncHandler(async (req, res) => {
  const { guestToken } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order || !order.isGuest) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!guestTokenMatches(order, guestToken)) {
    res.status(403);
    throw new Error("Not authorized");
  }

  if (order.isPaid) {
    return res.json(order);
  }

  const stripe = getStripeClient();
  if (!stripe) {
    res.status(503);
    throw new Error("Stripe is not configured");
  }
  if (!order.stripePaymentIntentId) {
    res.status(400);
    throw new Error("No payment was started for this order");
  }

  let pi;
  try {
    pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId, {
      expand: ["latest_charge"],
    });
  } catch (e) {
    res.status(502);
    throw new Error("Could not verify payment with Stripe");
  }

  if (pi.metadata?.orderId && pi.metadata.orderId !== String(order._id)) {
    res.status(400);
    throw new Error("Payment does not match this order");
  }

  if (pi.status === "succeeded") {
    const result = await applyPaymentIntentSuccess(order._id, stripe, pi, order.guestEmail || "");
    return res.json(result);
  }

  if (pi.status === "canceled") {
    order.paymentStatus = "canceled";
    await order.save();
  } else {
    order.paymentStatus = "pending";
    await order.save();
  }
  res.json(order);
});

// @desc    Mark payment failed
// @route   PUT /api/orders/:id/payment-failed
export const markPaymentFailed = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!assertOrderOwner(order, req)) {
    res.status(403);
    throw new Error("Not authorized");
  }
  if (!order.isPaid) {
    order.paymentStatus = "failed";
    if (message) console.warn("[order] payment failed:", message);
    await order.save();
  }
  res.json(order);
});

// @desc    Mark guest payment failed
// @route   PUT /api/orders/:id/payment-failed-guest
export const markGuestPaymentFailed = asyncHandler(async (req, res) => {
  const { message, guestToken } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order || !order.isGuest) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!guestTokenMatches(order, guestToken)) {
    res.status(403);
    throw new Error("Not authorized");
  }
  if (!order.isPaid) {
    order.paymentStatus = "failed";
    if (message) console.warn("[order] guest payment failed:", message);
    await order.save();
  }
  res.json(order);
});

// @desc    Download invoice (account holder)
// @route   GET /api/orders/:id/invoice
export const getOrderInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "firstName lastName email");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!assertOrderOwner(order, req)) {
    res.status(403);
    throw new Error("Not authorized");
  }
  if (!order.isPaid) {
    res.status(400);
    throw new Error("Invoice is available after payment is completed");
  }

  const userForInvoice = order.user?.email ? order.user : { email: order.receiptEmail, firstName: order.shippingAddress?.fullName || "Guest", lastName: "" };
  const embed = ["1", "true", "yes"].includes(String(req.query.embed || "").toLowerCase());
  const html = buildInvoiceHtml(order, userForInvoice, { embed });
  const safeId = String(order._id);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="invoice-${safeId}.html"`);
  res.send(html);
});

// @desc    Download guest invoice
// @route   GET /api/orders/:id/invoice-guest?guestToken=
export const getGuestOrderInvoice = asyncHandler(async (req, res) => {
  const guestToken = (req.query.guestToken || "").trim();
  const order = await Order.findById(req.params.id);
  if (!order || !order.isGuest) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!guestTokenMatches(order, guestToken)) {
    res.status(403);
    throw new Error("Not authorized");
  }
  if (!order.isPaid) {
    res.status(400);
    throw new Error("Invoice is available after payment is completed");
  }
  const userForInvoice = {
    email: order.guestEmail || order.receiptEmail,
    firstName: (order.shippingAddress?.fullName || "Guest").split(/\s+/)[0] || "Guest",
    lastName: (order.shippingAddress?.fullName || "").split(/\s+/).slice(1).join(" ") || "",
  };
  const embed = ["1", "true", "yes"].includes(String(req.query.embed || "").toLowerCase());
  const html = buildInvoiceHtml(order, userForInvoice, { embed });
  const safeId = String(order._id);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="invoice-${safeId}.html"`);
  res.send(html);
});

// @desc    Update order to paid (legacy)
// @route   PUT /api/orders/:id/pay
export const updateOrderToPaid = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!assertOrderOwner(order, req)) {
    res.status(403);
    throw new Error("Not authorized");
  }
  order.isPaid = true;
  order.paidAt = Date.now();
  order.paymentStatus = "paid";
  order.paymentResult = {
    id: req.body.id,
    status: req.body.status,
    update_time: req.body.update_time,
    email_address: req.body.email_address,
    receipt_url: req.body.receipt_url,
  };
  await order.save();
  await decrementInventoryForOrder(order);
  const updatedOrder = await Order.findById(order._id).populate("user", "firstName lastName email");
  res.json(updatedOrder);
});

// ——— Admin ———

export const getAdminOrderStats = asyncHandler(async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const paidOrders = await Order.countDocuments({
    isPaid: true,
    paymentStatus: { $ne: "canceled" },
  });
  const pendingPayment = await Order.countDocuments({
    isPaid: false,
    paymentStatus: { $in: ["pending", "failed"] },
  });
  const awaitingDispatch = await Order.countDocuments({
    isPaid: true,
    isDelivered: false,
    paymentStatus: { $ne: "canceled" },
  });
  const revenueAgg = await Order.aggregate([
    { $match: { isPaid: true, paymentStatus: { $ne: "canceled" } } },
    { $group: { _id: null, total: { $sum: "$totalPrice" } } },
  ]);
  const revenue = revenueAgg[0]?.total || 0;
  res.json({
    totalOrders,
    paidOrders,
    pendingPayment,
    awaitingDispatch,
    revenue: Number(revenue.toFixed(2)),
  });
});

export const getAdminOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
  const filter = {};

  if (req.query.payment === "paid") {
    filter.isPaid = true;
    filter.paymentStatus = { $ne: "canceled" };
  }
  if (req.query.payment === "unpaid") filter.isPaid = false;
  if (req.query.payment === "pending") filter.paymentStatus = "pending";
  if (req.query.payment === "failed") filter.paymentStatus = "failed";
  if (req.query.payment === "canceled") filter.paymentStatus = "canceled";

  if (req.query.delivered === "yes") filter.isDelivered = true;
  if (req.query.delivered === "no") filter.isDelivered = false;

  const q = (req.query.q || "").trim();
  if (q) {
    if (mongoose.isValidObjectId(q)) {
      filter._id = new mongoose.Types.ObjectId(q);
    } else {
      const rx = new RegExp(escapeRegex(q), "i");
      const matchingUsers = await User.find({
        $or: [{ email: rx }, { firstName: rx }, { lastName: rx }],
      })
        .select("_id")
        .lean();
      const userIds = matchingUsers.map((u) => u._id);
      const orConditions = [
        { guestEmail: rx },
        { receiptEmail: rx },
        { "shippingAddress.fullName": rx },
        { "shippingAddress.address": rx },
        { "shippingAddress.city": rx },
        { trackingNumber: rx },
        { couponCode: rx },
      ];
      if (userIds.length) orConditions.push({ user: { $in: userIds } });
      if (/^[a-f0-9]{8,23}$/i.test(q)) {
        orConditions.push({
          $expr: {
            $regexMatch: {
              input: { $toString: "$_id" },
              regex: `^${escapeRegex(q)}`,
              options: "i",
            },
          },
        });
      }
      filter.$or = orConditions;
    }
  }

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate("user", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.json({
    orders,
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
  });
});

export const getAdminOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "firstName lastName email phone");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  res.json(order);
});

export const getAdminOrderInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("user", "firstName lastName email");
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!order.isPaid) {
    res.status(400);
    throw new Error("Invoice is available after payment is completed");
  }
  const userForInvoice = order.user?.email
    ? order.user
    : { email: order.guestEmail || order.receiptEmail, firstName: order.shippingAddress?.fullName || "Guest", lastName: "" };
  const html = buildInvoiceHtml(order, userForInvoice);
  const safeId = String(order._id);
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="invoice-${safeId}.html"`);
  res.send(html);
});

export const updateOrderDelivered = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (order.paymentStatus === "canceled") {
    res.status(400);
    throw new Error("Canceled orders cannot be marked as delivered");
  }
  if (!order.isPaid) {
    res.status(400);
    throw new Error("Only paid orders can be marked as delivered");
  }
  const { shippingCarrier, trackingNumber, trackingUrl } = req.body || {};
  if (shippingCarrier != null) {
    const v = String(shippingCarrier).trim().slice(0, 80);
    order.shippingCarrier = v || undefined;
  }
  if (trackingNumber != null) {
    const v = String(trackingNumber).trim().slice(0, 120);
    order.trackingNumber = v || undefined;
  }
  if (trackingUrl != null) {
    const v = String(trackingUrl).trim().slice(0, 2000);
    order.trackingUrl = v || undefined;
  }
  const wasAlreadyDelivered = order.isDelivered;
  order.isDelivered = true;
  order.deliveredAt = req.body.deliveredAt ? new Date(req.body.deliveredAt) : new Date();
  await order.save();
  const fresh = await Order.findById(order._id).populate("user", "firstName lastName email");
  if (!wasAlreadyDelivered) {
    try {
      const recipient = emailRecipientFromOrder(fresh, null);
      await sendShippedNotificationEmail(fresh, recipient);
    } catch (err) {
      console.error("[email] shipped notification:", err?.message || err);
    }
  }
  res.json(fresh);
});

export const cancelAdminOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (order.paymentStatus === "canceled") {
    res.status(400);
    throw new Error("Order is already canceled");
  }
  if (order.isDelivered) {
    res.status(400);
    throw new Error("Delivered orders cannot be canceled");
  }

  if (order.isPaid) {
    await restoreInventoryForOrder(order);
  }

  order.paymentStatus = "canceled";
  await order.save();
  const fresh = await Order.findById(order._id).populate("user", "firstName lastName email");
  res.json(fresh);
});

export const validateCouponPublic = asyncHandler(async (req, res) => {
  if (!String(req.body.code || "").trim()) {
    res.status(400);
    throw new Error("Coupon code is required");
  }
  const itemsPrice = Number(req.body.itemsPrice);
  if (!Number.isFinite(itemsPrice) || itemsPrice <= 0) {
    res.status(400);
    throw new Error("Valid cart items total is required");
  }
  const coupon = await loadActiveCouponForCheckout(req.body.code);
  const discountAmount = computeDiscountAmount(coupon, itemsPrice);
  res.json({
    code: coupon.code,
    label: coupon.label || coupon.code,
    type: coupon.type,
    discountAmount,
    itemsPriceSubtotal: itemsPrice,
  });
});

export const updateAdminOrderShipment = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!order.isDelivered) {
    res.status(400);
    throw new Error("Mark the order as shipped first, then add or update tracking here.");
  }
  const { shippingCarrier, trackingNumber, trackingUrl } = req.body || {};
  if (shippingCarrier != null) {
    const v = String(shippingCarrier).trim().slice(0, 80);
    order.shippingCarrier = v || undefined;
  }
  if (trackingNumber != null) {
    const v = String(trackingNumber).trim().slice(0, 120);
    order.trackingNumber = v || undefined;
  }
  if (trackingUrl != null) {
    const v = String(trackingUrl).trim().slice(0, 2000);
    order.trackingUrl = v || undefined;
  }
  await order.save();
  const fresh = await Order.findById(order._id).populate("user", "firstName lastName email");
  res.json(fresh);
});

export const addAdminOrderNote = asyncHandler(async (req, res) => {
  const text = String(req.body.text || "").trim();
  if (!text) {
    res.status(400);
    throw new Error("Note text is required");
  }
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  const authorLabel =
    req.user.email ||
    `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() ||
    "Admin";
  order.adminNotes.push({ text, authorLabel });
  await order.save();
  const fresh = await Order.findById(order._id).populate("user", "firstName lastName email");
  res.json(fresh);
});

export const adminRefundStripeOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error("Order not found");
  }
  if (!order.isPaid || order.paymentStatus === "canceled") {
    res.status(400);
    throw new Error("Only paid, non-canceled orders can be refunded");
  }
  if (order.stripeRefundId) {
    res.status(400);
    throw new Error("A Stripe refund is already recorded for this order");
  }
  if (!order.stripePaymentIntentId) {
    res.status(400);
    throw new Error("No Stripe payment intent is linked to this order");
  }
  const stripe = getStripeClient();
  if (!stripe) {
    res.status(503);
    throw new Error("Stripe is not configured");
  }
  let refund;
  try {
    refund = await stripe.refunds.create({
      payment_intent: order.stripePaymentIntentId,
    });
  } catch (e) {
    res.status(502);
    throw new Error(e.message || "Stripe refund failed");
  }
  order.stripeRefundId = refund.id;
  order.refundedAmount = refund.amount != null ? refund.amount / 100 : Number(order.totalPrice);
  order.refundedAt = new Date();
  if (!order.isDelivered && order.inventoryAdjusted) {
    await restoreInventoryForOrder(order);
  }
  await order.save();
  const fresh = await Order.findById(order._id).populate("user", "firstName lastName email");
  res.json(fresh);
});

export const exportAdminOrdersCsv = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .sort({ createdAt: -1 })
    .limit(5000)
    .populate("user", "email firstName lastName")
    .lean();

  const esc = (v) => {
    if (v == null) return '""';
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };

  const header = [
    "id",
    "createdAt",
    "email",
    "isPaid",
    "paymentStatus",
    "total",
    "tax",
    "shipping",
    "itemsSubtotal",
    "discount",
    "coupon",
    "carrier",
    "tracking",
    "delivered",
    "refundedAt",
  ].join(",");

  const lines = [header];
  for (const o of orders) {
    const email = o.user?.email || o.guestEmail || "";
    lines.push(
      [
        esc(o._id),
        esc(o.createdAt ? new Date(o.createdAt).toISOString() : ""),
        esc(email),
        o.isPaid,
        esc(o.paymentStatus),
        o.totalPrice ?? 0,
        o.taxPrice ?? 0,
        o.shippingPrice ?? 0,
        o.itemsPriceSubtotal ?? o.itemsPrice ?? 0,
        o.discountAmount ?? 0,
        esc(o.couponCode),
        esc(o.shippingCarrier),
        esc(o.trackingNumber),
        o.isDelivered,
        esc(o.refundedAt ? new Date(o.refundedAt).toISOString() : ""),
      ].join(",")
    );
  }

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="orders-export.csv"');
  res.send(lines.join("\n"));
});
