import asyncHandler from "express-async-handler";
import NewsletterSubscriber from "../models/NewsletterSubscriber.js";

// @desc    Subscribe email to newsletter
// @route   POST /api/newsletter
export const subscribeNewsletter = asyncHandler(async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400);
    throw new Error("Valid email is required");
  }

  try {
    await NewsletterSubscriber.create({ email });
    res.status(201).json({ message: "Subscribed successfully" });
  } catch (err) {
    if (err.code === 11000) {
      res.status(200).json({ message: "Already subscribed" });
    } else {
      throw err;
    }
  }
});
