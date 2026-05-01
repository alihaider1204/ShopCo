/** Brand + layout shared by order, invoice, password reset, and shipping emails */

function storeName() {
  return process.env.STORE_NAME || "SHOP.CO";
}

export function escapeHtml(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {string} href - raw URL (escaped for HTML)
 * @param {string} label
 */
function emailCtaButton(href, label) {
  const h = escapeHtml(href);
  const l = escapeHtml(label);
  return `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0 0;"><tr><td align="left">
  <a href="${h}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;background:#111111;color:#ffffff!important;-webkit-font-smoothing:antialiased;font-size:15px;font-weight:700;text-decoration:none;border-radius:999px;font-family:system-ui,-apple-system,sans-serif;">${l}</a>
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#888888;line-height:1.5;word-break:break-all;">If the button doesn’t work, paste this link into your browser:<br /><a href="${h}" style="color:#111111;font-weight:600;">${h}</a></p>`;
}

/**
 * @param {{ title: string, preheader?: string, heroEyebrow?: string, heroTitle?: string, heroSubtitle?: string, bodyHtml: string }} opts
 */
export function emailShell(opts) {
  const {
    title,
    preheader = "",
    heroEyebrow = "",
    heroTitle = "",
    heroSubtitle = "",
    bodyHtml,
  } = opts;
  const brand = escapeHtml(storeName());
  const pre = preheader
    ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>`
    : "";
  const heroBlock =
    heroTitle &&
    `<tr>
      <td style="padding:24px 28px 8px;background:#ffffff;">
        ${heroEyebrow ? `<p style="margin:0 0 6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#888888;">${heroEyebrow}</p>` : ""}
        <h1 style="margin:0;font-size:22px;font-weight:800;letter-spacing:-0.02em;color:#111111;line-height:1.25;font-family:system-ui,-apple-system,sans-serif;">${heroTitle}</h1>
        ${heroSubtitle ? `<p style="margin:10px 0 0;font-size:15px;color:#555555;line-height:1.5;font-family:system-ui,-apple-system,sans-serif;">${heroSubtitle}</p>` : ""}
      </td>
    </tr>`;
  const contentPadding = heroTitle ? "8px 28px 28px" : "28px";
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="x-ua-compatible" content="ie=edge" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f6;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1A1A1A;line-height:1.55;-webkit-font-smoothing:antialiased;">
  ${pre}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f4f6;">
    <tr>
      <td align="center" style="padding:24px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E8ECEF;">
          <tr>
            <td style="padding:18px 24px;background:#111111;">
              <p style="margin:0;font-size:17px;font-weight:800;letter-spacing:-0.03em;color:#ffffff;font-family:system-ui,-apple-system,sans-serif;">${brand}</p>
            </td>
          </tr>
          ${heroBlock || ""}
          <tr>
            <td style="padding:${contentPadding};background:#ffffff;font-size:15px;color:#333333;line-height:1.55;font-family:system-ui,-apple-system,sans-serif;">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:18px 24px;background:#fafafa;border-top:1px solid #E8ECEF;font-size:12px;color:#777777;line-height:1.5;font-family:system-ui,-apple-system,sans-serif;">
              <p style="margin:0;">© ${year} ${brand}. All rights reserved.</p>
              <p style="margin:10px 0 0;">Questions? Reply to this email — we’re happy to help.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * @param {object} order — Mongoose order doc (lean or populated user)
 * @param {object} user — { firstName, lastName, email }
 */
export function buildOrderConfirmationHtml(order, user) {
  const name = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Customer";
  const rows = (order.orderItems || [])
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 8px;border-bottom:1px solid #E8ECEF;">${escapeHtml(item.name)}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #E8ECEF;text-align:center;">${item.qty}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #E8ECEF;text-align:right;">$${Number(item.price).toFixed(2)}</td>
        <td style="padding:12px 8px;border-bottom:1px solid #E8ECEF;text-align:right;font-weight:600;">$${(Number(item.price) * item.qty).toFixed(2)}</td>
      </tr>`
    )
      .join("");

  const ship = order.shippingAddress || {};

  const bodyHtml = `
        <p style="margin:0 0 18px;font-size:15px;color:#333333;">Order <strong style="color:#111111;">#${escapeHtml(String(order._id))}</strong></p>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-size:14px;border-collapse:collapse;">
          <thead>
            <tr style="background:#fafafa;">
              <th align="left" style="padding:10px 8px;border-bottom:1px solid #E8ECEF;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#666666;">Item</th>
              <th style="padding:10px 8px;border-bottom:1px solid #E8ECEF;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#666666;">Qty</th>
              <th align="right" style="padding:10px 8px;border-bottom:1px solid #E8ECEF;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#666666;">Price</th>
              <th align="right" style="padding:10px 8px;border-bottom:1px solid #E8ECEF;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#666666;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:16px;font-size:14px;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#555555;">Items</td><td align="right" style="padding:4px 0;">$${Number(order.itemsPrice).toFixed(2)}</td></tr>
          <tr><td style="padding:4px 0;color:#555555;">Shipping</td><td align="right" style="padding:4px 0;">$${Number(order.shippingPrice).toFixed(2)}</td></tr>
          <tr><td style="padding:4px 0;color:#555555;">Tax</td><td align="right" style="padding:4px 0;">$${Number(order.taxPrice).toFixed(2)}</td></tr>
          <tr><td style="padding:12px 0 0;font-weight:700;font-size:16px;color:#111111;">Total</td><td align="right" style="padding:12px 0 0;font-weight:700;font-size:16px;color:#111111;">$${Number(order.totalPrice).toFixed(2)}</td></tr>
        </table>
        <div style="margin-top:24px;padding-top:24px;border-top:1px solid #E8ECEF;font-size:14px;color:#444444;">
          <p style="margin:0 0 8px;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666666;">Ship to</p>
          ${ship.fullName ? `<p style="margin:0;">${escapeHtml(ship.fullName)}</p>` : ""}
          <p style="margin:4px 0 0;">${escapeHtml(ship.address || "")}</p>
          <p style="margin:4px 0 0;">${escapeHtml(ship.city || "")}, ${escapeHtml(ship.postalCode || "")}</p>
          <p style="margin:4px 0 0;">${escapeHtml(ship.country || "")}</p>
        </div>`;

  return emailShell({
    title: "Order confirmation",
    preheader: `Your ${storeName()} order is confirmed.`,
    heroEyebrow: "Order confirmed",
    heroTitle: "Thank you for your order",
    heroSubtitle: `Hi ${escapeHtml(name)}, we’ve received your payment and are getting things ready.`,
    bodyHtml,
  });
}

/**
 * Shipped / tracking notification (when admin marks order delivered / shipped).
 * @param {object} order — saved order with tracking fields
 * @param {{ firstName?: string, lastName?: string, email: string }} user
 */
export function buildShippedNotificationHtml(order, user) {
  const name = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : "Customer";
  const carrier = (order.shippingCarrier || "").trim();
  const trackingNumber = (order.trackingNumber || "").trim();
  const trackingUrl = (order.trackingUrl || "").trim();
  const orderId = String(order._id);

  let trackingBlock = "";
  if (carrier || trackingNumber) {
    trackingBlock = `
      <div style="margin:0 0 20px;padding:16px 18px;background:#fafafa;border:1px solid #E8ECEF;border-radius:12px;font-size:14px;">
        <p style="margin:0 0 10px;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666666;">Shipping details</p>
        ${carrier ? `<p style="margin:4px 0;"><strong style="color:#111111;">Carrier:</strong> ${escapeHtml(carrier)}</p>` : ""}
        ${trackingNumber ? `<p style="margin:4px 0;"><strong style="color:#111111;">Tracking #:</strong> ${escapeHtml(trackingNumber)}</p>` : ""}
      </div>`;
  }

  const cta =
    trackingUrl && trackingUrl.startsWith("http")
      ? emailCtaButton(trackingUrl, "Track your shipment")
      : "";

  const bodyHtml = `
        <p style="margin:0 0 16px;font-size:15px;color:#333333;">Your order <strong style="color:#111111;">#${escapeHtml(orderId)}</strong> is on the way.</p>
        ${trackingBlock}
        ${cta}
        <p style="margin:20px 0 0;font-size:14px;color:#666666;">You can also view your order anytime from your account on our store.</p>`;

  return emailShell({
    title: "Your order has shipped",
    preheader: `Your ${storeName()} order is on the way.`,
    heroEyebrow: "On the way",
    heroTitle: "Your order has shipped",
    heroSubtitle: `Hi ${escapeHtml(name)}, good news — your package has left our warehouse.`,
    bodyHtml,
  });
}

export function buildPasswordResetHtml(resetUrl) {
  const bodyHtml = `
        <p style="margin:0 0 16px;font-size:15px;color:#333333;">We received a request to reset the password for your <strong style="color:#111111;">${escapeHtml(storeName())}</strong> account.</p>
        <p style="margin:0 0 4px;font-size:15px;color:#555555;">Tap the button below to choose a new password. This link expires in <strong>one hour</strong> for your security.</p>
        ${emailCtaButton(resetUrl, "Set new password")}
        <p style="margin:24px 0 0;font-size:14px;color:#666666;">If you didn’t request this email, you can ignore it — your password will stay the same.</p>`;

  return emailShell({
    title: "Reset your password",
    preheader: `Reset your ${storeName()} password.`,
    heroEyebrow: "Account security",
    heroTitle: "Reset your password",
    heroSubtitle: "Quick and secure — one step to get back in.",
    bodyHtml,
  });
}

const BRAND_BAR_HTML = `<div class="email-brand-bar">${escapeHtml(storeName())}</div>`;

const SHARED_PRINT_STYLES = `
    body { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; margin: 0; color: #1A1A1A; background: #f4f4f6; line-height: 1.55; -webkit-font-smoothing: antialiased; }
    .wrap { max-width: 800px; margin: 0 auto; padding: clamp(1.25rem, 4vw, 2rem); background: #ffffff; border-radius: 16px; border: 1px solid #E8ECEF; box-sizing: border-box; }
    .email-brand-bar { margin: -1px -1px 0 -1px; padding: 16px 20px; background: #111111; color: #ffffff; font-size: 17px; font-weight: 800; letter-spacing: -0.03em; border-radius: 16px 16px 0 0; }
    h1 { font-size: clamp(1.35rem, 4vw, 1.75rem); margin: 0 0 0.35rem; font-weight: 800; letter-spacing: -0.02em; color: #111111; }
    .muted { color: #666666; font-size: 0.9rem; }
    .box { border: 1px solid #E8ECEF; border-radius: 12px; padding: 1rem; margin-top: 0.75rem; background: #fafafa; }
    .totals-wrap { width: 100%; max-width: 280px; margin-left: auto; margin-top: 1rem; font-size: 0.95rem; }
    .totals { width: 100%; border-collapse: collapse; }
    .totals td { padding: 4px 0; }
    .invoice-footer { margin-top: 2rem; padding-top: 1.25rem; border-top: 1px solid #E8ECEF; font-size: 12px; color: #777777; }
`;

/**
 * Full-page invoice HTML (download / admin). Pass `{ embed: true }` for the storefront modal preview only.
 * @param {object} order
 * @param {{ firstName?: string, lastName?: string, email?: string }} user
 * @param {{ embed?: boolean }} [options]
 */
export function buildInvoiceHtml(order, user, options = {}) {
  const embed = !!options.embed;
  const email = user?.email || "";
  const name = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
    : order.shippingAddress?.fullName || "Customer";
  const created = order.createdAt ? new Date(order.createdAt).toLocaleString() : "";
  const paid = order.paidAt ? new Date(order.paidAt).toLocaleString() : "—";
  const ship = order.shippingAddress || {};
  const pi = order.paymentResult?.id || order.stripePaymentIntentId || "—";

  const rowsStatic = (order.orderItems || [])
    .map(
      (item) => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #E8ECEF;">${escapeHtml(item.name)}${item.size ? ` <small>(${escapeHtml(item.size)})</small>` : ""}${item.color ? ` <small>· ${escapeHtml(item.color)}</small>` : ""}</td>
      <td style="padding:10px;border-bottom:1px solid #E8ECEF;text-align:center;">${item.qty}</td>
      <td style="padding:10px;border-bottom:1px solid #E8ECEF;text-align:right;">$${Number(item.price).toFixed(2)}</td>
      <td style="padding:10px;border-bottom:1px solid #E8ECEF;text-align:right;">$${(Number(item.price) * item.qty).toFixed(2)}</td>
    </tr>`
    )
    .join("");

  const rowsEmbed = (order.orderItems || [])
    .map(
      (item) => `
    <tr>
      <td data-label="Item" style="padding:10px;border-bottom:1px solid #E8ECEF;">${escapeHtml(item.name)}${item.size ? ` <small>(${escapeHtml(item.size)})</small>` : ""}${item.color ? ` <small>· ${escapeHtml(item.color)}</small>` : ""}</td>
      <td data-label="Qty" style="padding:10px;border-bottom:1px solid #E8ECEF;text-align:center;">${item.qty}</td>
      <td data-label="Price" style="padding:10px;border-bottom:1px solid #E8ECEF;text-align:right;">$${Number(item.price).toFixed(2)}</td>
      <td data-label="Total" style="padding:10px;border-bottom:1px solid #E8ECEF;text-align:right;">$${(Number(item.price) * item.qty).toFixed(2)}</td>
    </tr>`
    )
    .join("");

  const shipSection = `
    <p style="margin: 1rem 0 0.35rem; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #666666;">Ship to</p>
    <div class="box">
      ${ship.fullName ? escapeHtml(ship.fullName) + "<br />" : ""}
      ${escapeHtml(ship.address || "")}<br />
      ${escapeHtml(ship.city || "")}, ${escapeHtml(ship.postalCode || "")}<br />
      ${escapeHtml(ship.country || "")}
    </div>`;

  const totalsSection = `
    <div class="totals-wrap">
    <table class="totals">
      <tr><td>Items</td><td align="right">$${Number(order.itemsPrice).toFixed(2)}</td></tr>
      <tr><td>Shipping</td><td align="right">$${Number(order.shippingPrice).toFixed(2)}</td></tr>
      <tr><td>Tax</td><td align="right">$${Number(order.taxPrice).toFixed(2)}</td></tr>
      <tr><td style="padding-top:12px;font-weight:700;font-size:1.1rem;">Total</td><td align="right" style="padding-top:12px;font-weight:700;font-size:1.1rem;">$${Number(order.totalPrice).toFixed(2)}</td></tr>
    </table>
    </div>`;

  const headerSection = `
    <h1>Receipt / invoice</h1>
    <p class="muted">Order #${String(order._id)} · ${order.isPaid ? "Paid" : "Unpaid"}</p>`;

  const footerNote = `<div class="invoice-footer"><p class="muted" style="margin:0;">Thank you for shopping with ${escapeHtml(storeName())}.</p><p style="margin:10px 0 0;">© ${new Date().getFullYear()} ${escapeHtml(storeName())}. All rights reserved.</p></div>`;

  if (!embed) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invoice ${String(order._id)}</title>
  <style>${SHARED_PRINT_STYLES}</style>
</head>
<body>
  <div class="wrap">
    ${BRAND_BAR_HTML}
    ${headerSection}
    <table style="width:100%;margin:1.5rem 0;border-collapse:collapse;">
      <tr>
        <td style="width:50%;padding:4px 12px 4px 0;vertical-align:top;">
          <strong style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#666666;">Bill to</strong><br />
          ${escapeHtml(name)}<br />
          ${email ? escapeHtml(email) + "<br />" : ""}
        </td>
        <td style="width:50%;padding:4px 0 4px 12px;vertical-align:top;">
          <strong style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#666666;">Details</strong><br />
          Date: ${escapeHtml(created)}<br />
          Paid at: ${escapeHtml(paid)}<br />
          Payment ref: ${escapeHtml(pi)}
        </td>
      </tr>
    </table>
    ${shipSection}
    <table style="width:100%;border-collapse:collapse;margin-top:1.5rem;font-size:0.95rem;">
      <thead>
        <tr style="background:#111111;color:#ffffff;">
          <th align="left" style="padding:12px;">Item</th>
          <th style="padding:12px;">Qty</th>
          <th align="right" style="padding:12px;">Price</th>
          <th align="right" style="padding:12px;">Total</th>
        </tr>
      </thead>
      <tbody>${rowsStatic}</tbody>
    </table>
    ${totalsSection}
    ${footerNote}
  </div>
</body>
</html>`;
  }

  const totalsSectionEmbed = `
    <div class="totals-wrap">
    <table class="totals">
      <tr><td>Items</td><td align="right">$${Number(order.itemsPrice).toFixed(2)}</td></tr>
      <tr><td>Shipping</td><td align="right">$${Number(order.shippingPrice).toFixed(2)}</td></tr>
      <tr><td>Tax</td><td align="right">$${Number(order.taxPrice).toFixed(2)}</td></tr>
      <tr><td style="padding-top:12px;font-weight:700;font-size: clamp(0.95rem, 3.5vw, 1.1rem);">Total</td><td align="right" style="padding-top:12px;font-weight:700;font-size: clamp(0.95rem, 3.5vw, 1.1rem);">$${Number(order.totalPrice).toFixed(2)}</td></tr>
    </table>
    </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invoice ${String(order._id)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html { -webkit-text-size-adjust: 100%; }
    ${SHARED_PRINT_STYLES}
    .wrap {
      max-width: 800px;
      margin: 0 auto;
      padding: clamp(1rem, 4vw, 2rem);
      overflow-x: hidden;
      container-type: inline-size;
      container-name: invoice;
    }
    .invoice-meta {
      display: grid;
      grid-template-columns: 1fr;
      gap: clamp(1rem, 3vw, 1.25rem);
      margin: 1.5rem 0;
    }
    @container invoice (min-width: 640px) {
      .invoice-meta {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    .invoice-meta__block {
      border: 1px solid #E8ECEF;
      border-radius: 12px;
      padding: clamp(0.85rem, 3vw, 1rem);
      background: #fafafa;
      min-width: 0;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .invoice-meta__block strong { display: block; margin-bottom: 0.5rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #666666; }
    .invoice-meta__block br + * { line-height: 1.45; }
    .invoice-table-scroll {
      width: 100%;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      margin-top: 1.5rem;
      border-radius: 12px;
      border: 1px solid #E8ECEF;
    }
    .line-items {
      width: 100%;
      min-width: 320px;
      border-collapse: collapse;
      font-size: clamp(0.8rem, 3.2vw, 0.95rem);
    }
    .line-items th { padding: clamp(8px, 2vw, 12px); white-space: nowrap; }
    .line-items td { padding: clamp(8px, 2vw, 10px); vertical-align: top; }
    .line-items small { white-space: normal; }
    .totals-wrap { width: 100%; max-width: 320px; margin-left: auto; margin-top: 1rem; font-size: clamp(0.85rem, 3.5vw, 0.95rem); }
    .totals { width: 100%; border-collapse: collapse; }
    .totals td { padding: 4px 0; word-break: break-word; }
    @container invoice (max-width: 639px) {
      .totals-wrap { max-width: none; margin-left: 0; }
      .line-items thead { display: none; }
      .line-items tbody tr { display: block; border-bottom: 1px solid #E8ECEF; padding: 0.65rem 0; margin-bottom: 0.25rem; }
      .line-items tbody tr:last-child { border-bottom: none; }
      .line-items tbody td {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.35rem 0.75rem !important;
        border: none !important;
        text-align: right !important;
      }
      .line-items tbody td::before {
        content: attr(data-label);
        font-weight: 600;
        color: #333333;
        flex-shrink: 0;
        text-align: left;
        padding-right: 0.5rem;
      }
      .line-items tbody td[data-label="Item"] { flex-direction: column; align-items: stretch; text-align: left !important; }
      .line-items tbody td[data-label="Item"]::before { padding-bottom: 0.25rem; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    ${BRAND_BAR_HTML}
    ${headerSection}
    <div class="invoice-meta">
      <div class="invoice-meta__block">
        <strong>Bill to</strong>
        ${escapeHtml(name)}<br />
        ${email ? escapeHtml(email) + "<br />" : ""}
      </div>
      <div class="invoice-meta__block">
        <strong>Details</strong>
        Date: ${escapeHtml(created)}<br />
        Paid at: ${escapeHtml(paid)}<br />
        Payment ref: ${escapeHtml(pi)}
      </div>
    </div>
    ${shipSection}
    <div class="invoice-table-scroll">
    <table class="line-items">
      <thead>
        <tr style="background:#111111;color:#ffffff;">
          <th align="left" style="padding:12px;">Item</th>
          <th style="padding:12px;">Qty</th>
          <th align="right" style="padding:12px;">Price</th>
          <th align="right" style="padding:12px;">Total</th>
        </tr>
      </thead>
      <tbody>${rowsEmbed}</tbody>
    </table>
    </div>
    ${totalsSectionEmbed}
    ${footerNote}
  </div>
</body>
</html>`;
}
