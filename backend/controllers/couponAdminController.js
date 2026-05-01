import asyncHandler from "express-async-handler";
import Coupon from "../models/Coupon.js";

export const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({}).sort({ createdAt: -1 }).lean();
  res.json(coupons);
});

export const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    label,
    type,
    value,
    minOrderAmount = 0,
    maxUses,
    expiresAt,
    active = true,
  } = req.body;
  const c = String(code || "")
    .trim()
    .toUpperCase();
  if (!c || !["percent", "fixed"].includes(type)) {
    res.status(400);
    throw new Error("code and type (percent|fixed) are required");
  }
  const v = Number(value);
  if (!Number.isFinite(v) || v < 0) {
    res.status(400);
    throw new Error("Valid value is required");
  }
  if (type === "percent" && v > 100) {
    res.status(400);
    throw new Error("Percent cannot exceed 100");
  }
  const coupon = await Coupon.create({
    code: c,
    label: (label || "").trim() || undefined,
    type,
    value: v,
    minOrderAmount: Number(minOrderAmount) || 0,
    maxUses: maxUses === "" || maxUses == null ? null : Math.max(0, Number(maxUses)),
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    active: !!active,
  });
  res.status(201).json(coupon);
});

export const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }
  const {
    label,
    type,
    value,
    minOrderAmount,
    maxUses,
    expiresAt,
    active,
    code: codeRaw,
  } = req.body;

  if (codeRaw != null) {
    const c = String(codeRaw).trim().toUpperCase();
    if (!c) {
      res.status(400);
      throw new Error("Invalid code");
    }
    const taken = await Coupon.findOne({ code: c, _id: { $ne: coupon._id } });
    if (taken) {
      res.status(400);
      throw new Error("Code already in use");
    }
    coupon.code = c;
  }
  if (label !== undefined) coupon.label = String(label).trim();
  if (type !== undefined) {
    if (!["percent", "fixed"].includes(type)) {
      res.status(400);
      throw new Error("Invalid type");
    }
    coupon.type = type;
  }
  if (value !== undefined) {
    const v = Number(value);
    if (!Number.isFinite(v) || v < 0) {
      res.status(400);
      throw new Error("Invalid value");
    }
    coupon.value = v;
  }
  if (minOrderAmount !== undefined) coupon.minOrderAmount = Number(minOrderAmount) || 0;
  if (maxUses !== undefined) {
    coupon.maxUses = maxUses === "" || maxUses == null ? null : Math.max(0, Number(maxUses));
  }
  if (expiresAt !== undefined) coupon.expiresAt = expiresAt ? new Date(expiresAt) : null;
  if (active !== undefined) coupon.active = !!active;
  await coupon.save();
  res.json(coupon);
});

export const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon not found");
  }
  await coupon.deleteOne();
  res.json({ message: "Coupon deleted" });
});
