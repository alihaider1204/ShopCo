import sgMail from "@sendgrid/mail";
import { buildOrderConfirmationHtml, buildPasswordResetHtml, buildShippedNotificationHtml } from "../utils/emailTemplates.js";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL      = (process.env.EMAIL_FROM || process.env.SMTP_USER || "").trim();
const STORE_NAME      = process.env.STORE_NAME  || "SHOP.CO";

function getSgClient() {
  if (!SENDGRID_API_KEY) return null;
  sgMail.setApiKey(SENDGRID_API_KEY);
  return sgMail;
}

async function sendViaSendGrid(to, subject, html) {
  const sg = getSgClient();
  if (!sg) {
    console.warn("[email] SENDGRID_API_KEY not set — skipping email to:", to);
    return false;
  }
  if (!FROM_EMAIL) {
    console.warn("[email] EMAIL_FROM not set — skipping email to:", to);
    return false;
  }
  try {
    await sg.send({ from: { name: STORE_NAME, email: FROM_EMAIL }, to, subject, html });
    console.log("[email] sent via SendGrid to:", to);
    return true;
  } catch (err) {
    const detail = err?.response?.body?.errors?.[0]?.message || err.message;
    console.error("[email] SendGrid sendMail failed:", detail);
    return false;
  }
}

/**
 * @param {import('mongoose').Document} order
 * @param {{ firstName?: string, lastName?: string, email: string }} user
 */
export async function sendOrderConfirmationEmail(order, user) {
  const to = user?.email;
  if (!to) { console.warn("[email] No recipient for order confirmation"); return false; }
  const html = buildOrderConfirmationHtml(order, user);
  return sendViaSendGrid(to, `Order confirmed — ${STORE_NAME} · #${String(order._id).slice(-8)}`, html);
}

/**
 * @param {string} to
 * @param {string} resetUrl
 */
export async function sendPasswordResetEmail(to, resetUrl) {
  if (!to) { console.warn("[email] No recipient for password reset"); return false; }
  const html = buildPasswordResetHtml(resetUrl);
  return sendViaSendGrid(to, `Reset your password · ${STORE_NAME}`, html);
}

/**
 * @param {import('mongoose').Document} order
 * @param {{ firstName?: string, lastName?: string, email: string }} user
 */
export async function sendShippedNotificationEmail(order, user) {
  const to = user?.email;
  if (!to) { console.warn("[email] No recipient for shipped notification"); return false; }
  const html = buildShippedNotificationHtml(order, user);
  return sendViaSendGrid(to, `Your order has shipped — ${STORE_NAME} #${String(order._id).slice(-8)}`, html);
}
