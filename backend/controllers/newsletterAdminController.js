import asyncHandler from "express-async-handler";
import NewsletterSubscriber from "../models/NewsletterSubscriber.js";

export const listNewsletterSubscribers = asyncHandler(async (req, res) => {
  const subs = await NewsletterSubscriber.find({}).sort({ createdAt: -1 }).lean();
  res.json(subs);
});

export const deleteNewsletterSubscriber = asyncHandler(async (req, res) => {
  const sub = await NewsletterSubscriber.findById(req.params.id);
  if (!sub) {
    res.status(404);
    throw new Error("Subscriber not found");
  }
  await sub.deleteOne();
  res.json({ message: "Removed" });
});

export const exportNewsletterCsv = asyncHandler(async (req, res) => {
  const subs = await NewsletterSubscriber.find({}).sort({ createdAt: -1 }).lean();
  const esc = (v) => {
    if (v == null) return '""';
    const s = String(v).replace(/"/g, '""');
    return `"${s}"`;
  };
  const lines = ["email,subscribedAt"];
  for (const s of subs) {
    lines.push(`${esc(s.email)},${esc(s.createdAt ? new Date(s.createdAt).toISOString() : "")}`);
  }
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="newsletter-subscribers.csv"');
  res.send(lines.join("\n"));
});
