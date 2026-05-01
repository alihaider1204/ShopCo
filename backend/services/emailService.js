import nodemailer from "nodemailer";
import { buildOrderConfirmationHtml, buildPasswordResetHtml, buildShippedNotificationHtml } from "../utils/emailTemplates.js";

function createTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10_000,  // fail fast if SMTP host is unreachable (10 s)
    socketTimeout: 15_000,      // fail fast if send stalls mid-stream (15 s)
    greetingTimeout: 10_000,
  });
}

/**
 * @param {import('mongoose').Document} order — saved order with orderItems
 * @param {{ firstName?: string, lastName?: string, email: string }} user
 */
export async function sendOrderConfirmationEmail(order, user) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@example.com";
  const to = user?.email;
  if (!to) {
    console.warn("[email] No recipient for order confirmation");
    return false;
  }

  const html = buildOrderConfirmationHtml(order, user);
  const transport = createTransport();

  if (!transport) {
    console.log("[email] SMTP not configured — order confirmation (preview):", to);
    console.log("[email] Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM in .env to send real mail.");
    return false;
  }

  try {
    await transport.sendMail({
      from: `"${process.env.STORE_NAME || "Our Store"}" <${from}>`,
      to,
      subject: `Order confirmed — ${process.env.STORE_NAME || "SHOP.CO"} · #${String(order._id).slice(-8)}`,
      html,
    });
    return true;
  } catch (err) {
    console.error("[email] sendMail failed:", err.message);
    return false;
  }
}

/**
 * @param {string} to
 * @param {string} resetUrl — full URL to frontend reset page including token path/query
 */
export async function sendPasswordResetEmail(to, resetUrl) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@example.com";
  if (!to) {
    console.warn("[email] No recipient for password reset");
    return false;
  }
  const html = buildPasswordResetHtml(resetUrl);
  const transport = createTransport();

  if (!transport) {
    console.log("[email] SMTP not configured — password reset link (preview):", resetUrl);
    return false;
  }

  try {
    await transport.sendMail({
      from: `"${process.env.STORE_NAME || "Our Store"}" <${from}>`,
      to,
      subject: `Reset your password · ${process.env.STORE_NAME || "SHOP.CO"}`,
      html,
    });
    return true;
  } catch (err) {
    console.error("[email] password reset sendMail failed:", err.message);
    return false;
  }
}

/**
 * Shipped / tracking email after admin marks order as shipped.
 * @param {import('mongoose').Document} order
 * @param {{ firstName?: string, lastName?: string, email: string }} user
 */
export async function sendShippedNotificationEmail(order, user) {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@example.com";
  const to = user?.email;
  const brand = process.env.STORE_NAME || "SHOP.CO";
  if (!to) {
    console.warn("[email] No recipient for shipped notification");
    return false;
  }

  const html = buildShippedNotificationHtml(order, user);
  const transport = createTransport();

  if (!transport) {
    console.log("[email] SMTP not configured — shipped notification skipped for:", to);
    return false;
  }

  try {
    await transport.sendMail({
      from: `"${brand}" <${from}>`,
      to,
      subject: `Your order has shipped — ${brand} #${String(order._id).slice(-8)}`,
      html,
    });
    return true;
  } catch (err) {
    console.error("[email] shipped notification sendMail failed:", err.message);
    return false;
  }
}
