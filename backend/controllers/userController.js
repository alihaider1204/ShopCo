import asyncHandler from "express-async-handler";
import User from "../models/User.js";

const normalizeEmail = (email) => (email || "").trim().toLowerCase();

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const PW_MIN = 8;

// @desc    Get user profile
// @route   GET /api/users/profile
export const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: user.isAdmin,
      phone: user.phone,
      primaryAddress: user.primaryAddress,
      shippingAddress: user.shippingAddress,
      billingAddress: user.billingAddress,
      preferences: user.preferences,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Update user profile (no role / isAdmin escalation via body)
// @route   PUT /api/users/profile
export const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (req.body.firstName != null) {
    const v = String(req.body.firstName).trim();
    if (!v) {
      res.status(400);
      throw new Error("First name cannot be empty");
    }
    user.firstName = v;
  }
  if (req.body.lastName != null) {
    const v = String(req.body.lastName).trim();
    if (!v) {
      res.status(400);
      throw new Error("Last name cannot be empty");
    }
    user.lastName = v;
  }
  if (req.body.phone !== undefined) {
    user.phone = req.body.phone ? String(req.body.phone).trim() : undefined;
  }
  if (req.body.primaryAddress !== undefined) {
    user.primaryAddress = req.body.primaryAddress || undefined;
  }
  if (req.body.shippingAddress !== undefined) {
    user.shippingAddress = req.body.shippingAddress || undefined;
  }
  if (req.body.billingAddress !== undefined) {
    user.billingAddress = req.body.billingAddress || undefined;
  }
  if (req.body.preferences !== undefined && req.body.preferences !== null) {
    user.preferences = {
      ...user.preferences,
      ...req.body.preferences,
    };
  }

  if (req.body.email !== undefined) {
    const e = normalizeEmail(req.body.email);
    if (!e || !isValidEmail(e)) {
      res.status(400);
      throw new Error("Valid email is required");
    }
    const taken = await User.findOne({ email: e, _id: { $ne: user._id } });
    if (taken) {
      res.status(400);
      throw new Error("That email is already in use");
    }
    user.email = e;
  }

  if (req.body.password) {
    const pw = String(req.body.password).trim();
    if (pw.length < PW_MIN) {
      res.status(400);
      throw new Error(`Password must be at least ${PW_MIN} characters`);
    }
    user.password = pw;
  }

  const updatedUser = await user.save();
  res.json({
    _id: updatedUser._id,
    firstName: updatedUser.firstName,
    lastName: updatedUser.lastName,
    email: updatedUser.email,
    isAdmin: updatedUser.isAdmin,
    phone: updatedUser.phone,
    primaryAddress: updatedUser.primaryAddress,
    shippingAddress: updatedUser.shippingAddress,
    billingAddress: updatedUser.billingAddress,
    preferences: updatedUser.preferences,
  });
});
