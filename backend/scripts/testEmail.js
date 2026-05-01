/**
 * Quick SMTP check using the same env vars as services/emailService.js
 * Run from backend root: npm run test:email
 *
 * Required: SMTP_HOST, SMTP_USER, SMTP_PASS
 * Optional: SMTP_PORT (default 587), EMAIL_FROM (default SMTP_USER),
 *           TEST_EMAIL_TO (recipient; default SMTP_USER — send to yourself)
 */
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const host = process.env.SMTP_HOST;
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.EMAIL_FROM?.trim() || user;
const to = (process.env.TEST_EMAIL_TO || user || "").trim();
const store = process.env.STORE_NAME || "SMTP test";

async function main() {
  if (!host || !user || !pass) {
    console.error(
      "Missing SMTP config. Set in .env: SMTP_HOST, SMTP_USER, SMTP_PASS\n" +
        `  host: ${host ? "ok" : "MISSING"}, user: ${user ? "ok" : "MISSING"}, pass: ${pass ? "ok" : "MISSING"}`
    );
    process.exit(1);
  }

  if (!to) {
    console.error("No recipient: set SMTP_USER or TEST_EMAIL_TO in .env");
    process.exit(1);
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  console.log(`Using ${host}:${port}, from: ${from}, to: ${to}`);

  try {
    await transport.verify();
    console.log("verify() — server accepted auth (or connection OK).");
  } catch (err) {
    console.error("verify() failed:", err.message);
    process.exit(1);
  }

  const subject = `[${store}] SMTP test`;
  const html = `<p>If you see this, email from your app’s SMTP settings works.</p><p><code>${new Date().toISOString()}</code></p>`;

  try {
    const info = await transport.sendMail({
      from: `"${store}" <${from}>`,
      to,
      subject,
      html,
      text: `SMTP test at ${new Date().toISOString()}`,
    });
    console.log("sendMail OK — messageId:", info.messageId);
    console.log("Check the inbox (and spam) for:", to);
  } catch (err) {
    console.error("sendMail failed:", err.message);
    process.exit(1);
  }
}

main();
