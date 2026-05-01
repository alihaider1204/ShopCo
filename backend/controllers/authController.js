import asyncHandler from "express-async-handler";
import crypto from "crypto";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail } from "../services/emailService.js";

/** Aligns with middleware: admin access if isAdmin flag OR role is admin */
const generateToken = (user) => {
  const id = user._id;
  const isAdmin = !!(user.isAdmin || user.role === "admin");
  const role = user.role || "buyer";
  return jwt.sign({ id, isAdmin, role }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const normalizeEmail = (email) => (email || "").trim().toLowerCase();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Case-insensitive lookup for legacy accounts; prefers normalized email
const findUserByEmail = async (emailRaw) => {
  const normalized = normalizeEmail(emailRaw);
  if (!normalized) return null;
  let user = await User.findOne({ email: normalized });
  if (!user) {
    user = await User.findOne({
      email: new RegExp(`^${escapeRegex(normalized)}$`, "i"),
    });
  }
  return user;
};

const PW_MIN = 8;

// @desc    Register new user
// @route   POST /api/auth/register
export const registerUser = asyncHandler(async (req, res) => {
  let { firstName, lastName, email, password } = req.body;

  firstName = (firstName || "").trim();
  lastName = (lastName || "").trim();
  email = normalizeEmail(email);
  password = (password || "").trim();

  if (!firstName || !lastName) {
    res.status(400);
    throw new Error("First and last name are required");
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400);
    throw new Error("Valid email is required");
  }
  if (!password || password.length < PW_MIN) {
    res.status(400);
    throw new Error(`Password must be at least ${PW_MIN} characters`);
  }

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error("An account with this email already exists");
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      token: generateToken(user),
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
export const authUser = asyncHandler(async (req, res) => {
  const emailRaw = req.body.email;
  const password = (req.body.password || "").trim();
  const normalized = normalizeEmail(emailRaw);

  if (!normalized || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await findUserByEmail(emailRaw);

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isAdmin: user.isAdmin,
      role: user.role,
      token: generateToken(user),
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

const hashResetToken = (t) => crypto.createHash("sha256").update(String(t), "utf8").digest("hex");

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const emailRaw = req.body.email;
  const email = normalizeEmail(emailRaw);

  if (email) {
    const user = await findUserByEmail(emailRaw);
    if (user) {
      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = hashResetToken(resetToken);
      user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
      await user.save({ validateBeforeSave: false });
      const base = String(process.env.FRONTEND_URL ?? "").trim().replace(/\/$/, "");
      if (base) {
        const resetUrl = `${base}/reset-password/${resetToken}`;
        await sendPasswordResetEmail(user.email, resetUrl);
      } else {
        console.error("FRONTEND_URL is not set; password reset email was not sent. Set FRONTEND_URL in backend .env.");
      }
    }
  }

  res.json({
    message: "If an account exists for that email, we sent reset instructions.",
  });
});

// @desc    Set new password with reset token
// @route   POST /api/auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
  const token = (req.body.token || "").trim();
  const password = (req.body.password || "").trim();

  if (!token || !password || password.length < PW_MIN) {
    res.status(400);
    throw new Error(`Valid token and password (min ${PW_MIN} characters) are required`);
  }

  const user = await User.findOne({
    resetPasswordToken: hashResetToken(token),
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired reset link");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({ message: "Password updated. You can sign in." });
});
