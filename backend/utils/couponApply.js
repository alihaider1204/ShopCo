import Coupon from "../models/Coupon.js";

/**
 * @param {import('../models/Coupon.js').default} coupon
 * @param {number} itemsPriceSubtotal
 */
export function computeDiscountAmount(coupon, itemsPriceSubtotal) {
  const sub = Number(itemsPriceSubtotal);
  if (!coupon || !Number.isFinite(sub) || sub <= 0) return 0;
  const minA = Number(coupon.minOrderAmount) || 0;
  if (minA > 0 && sub < minA) {
    const err = new Error(`This code requires a minimum order of $${minA.toFixed(2)}`);
    err.statusCode = 400;
    throw err;
  }
  let d = 0;
  if (coupon.type === "percent") {
    d = (sub * Number(coupon.value)) / 100;
  } else {
    d = Math.min(Number(coupon.value), sub);
  }
  return Math.round(Math.max(0, d) * 100) / 100;
}

export async function loadActiveCouponForCheckout(rawCode) {
  const code = String(rawCode || "")
    .trim()
    .toUpperCase();
  if (!code) {
    const err = new Error("Coupon code is required");
    err.statusCode = 400;
    throw err;
  }
  const coupon = await Coupon.findOne({ code, active: true });
  if (!coupon) {
    const err = new Error("Invalid or inactive coupon code");
    err.statusCode = 400;
    throw err;
  }
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() < Date.now()) {
    const err = new Error("This coupon has expired");
    err.statusCode = 400;
    throw err;
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    const err = new Error("This coupon has reached its usage limit");
    err.statusCode = 400;
    throw err;
  }
  return coupon;
}

export async function recordCouponRedemption(orderDoc) {
  if (!orderDoc?.couponCode || orderDoc.couponUsageRecorded) return;
  const updated = await Coupon.findOneAndUpdate(
    {
      code: orderDoc.couponCode,
      $or: [{ maxUses: null }, { $expr: { $lt: ["$usedCount", "$maxUses"] } }],
    },
    { $inc: { usedCount: 1 } },
    { new: true }
  );
  if (!updated) {
    console.warn("[coupon] Could not increment usage for code", orderDoc.couponCode);
  }
  orderDoc.couponUsageRecorded = true;
  await orderDoc.save();
}
