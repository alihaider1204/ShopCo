import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import mongoose from "mongoose";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import newsletterRoutes from "./routes/newsletterRoutes.js";
import adminHubRoutes from "./routes/adminHubRoutes.js";
import { getPublicHero } from "./controllers/siteContentController.js";

import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

import { stripeWebhook } from "./controllers/stripeWebhookController.js";

if (!process.env.JWT_SECRET || String(process.env.JWT_SECRET).length < 16) {
  console.warn(
    "[security] JWT_SECRET should be a long random string (16+ characters)."
  );
}

const app = express();

/**
 * Trust the first hop proxy (Render, Heroku, Vercel, etc.).
 * Required so express-rate-limit can read the real client IP from X-Forwarded-For.
 * '1' means trust one proxy layer — safe for single-proxy deployments like Render.
 */
app.set('trust proxy', 1);

/** Stripe webhooks require raw body — must run before express.json() */
app.post(
  "/api/payment/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { message: "Too many attempts. Please try again in a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const newsletterLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 25,
  message: { message: "Too many subscription attempts. Try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(helmet());
app.use(
  express.json({
    limit: process.env.JSON_BODY_LIMIT || "1mb",
  })
);
app.use(mongoSanitize());

const corsOrigin = process.env.CORS_ORIGIN;
app.use(
  cors(
    corsOrigin
      ? {
          origin: corsOrigin.split(",").map((o) => o.trim()),
          credentials: true,
        }
      : {}
  )
);
app.use(morgan("dev"));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/categories", categoryRoutes);
app.get("/api/site-content/home_hero", getPublicHero);
app.use("/api/admin", adminHubRoutes);
app.use("/api/newsletter", newsletterLimiter, newsletterRoutes);

// ── Temporary SendGrid diagnostic endpoint — remove after testing ──────────
app.get("/api/debug/test-email", async (req, res) => {
  const secret = process.env.DEBUG_SECRET;
  if (!secret || req.query.secret !== secret) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const apiKey = process.env.SENDGRID_API_KEY;
  const from   = (process.env.EMAIL_FROM || "").trim();
  const to     = (req.query.to || from || "").trim();
  if (!apiKey) return res.json({ ok: false, step: "config", error: "SENDGRID_API_KEY not set" });
  if (!from)   return res.json({ ok: false, step: "config", error: "EMAIL_FROM not set" });
  if (!to)     return res.json({ ok: false, step: "config", error: "to address missing" });
  try {
    const { default: sgMail } = await import("@sendgrid/mail");
    sgMail.setApiKey(apiKey);
    await sgMail.send({
      from: { name: process.env.STORE_NAME || "SMTP test", email: from },
      to,
      subject: `[${process.env.STORE_NAME || "SHOP.CO"}] email test`,
      text: `SendGrid is working. Sent at ${new Date().toISOString()}`,
    });
    return res.json({ ok: true, to, from });
  } catch (err) {
    const detail = err?.response?.body?.errors?.[0]?.message || err.message;
    return res.json({ ok: false, step: "sendGrid", error: detail });
  }
});
// ── End temporary endpoint ──────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

if (!process.env.MONGO_URI) {
  console.error("[startup] MONGO_URI is not set — cannot start.");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
