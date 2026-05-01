import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

const DAY_COUNT = 14;

function utcYmd(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Last n calendar days in UTC as ISO date strings (oldest first). */
function lastNDaysIso(n) {
  const days = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
    days.push(utcYmd(d));
  }
  return days;
}

function formatShortLabel(isoDate) {
  const [y, m, day] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, day));
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function buildSeries(dayKeys, rows) {
  const map = new Map(rows.map((r) => [r._id, r]));
  return dayKeys.map((d) => {
    const row = map.get(d);
    return {
      date: d,
      label: formatShortLabel(d),
      orders: row?.count ?? 0,
      revenue: Number((row?.revenue ?? 0).toFixed(2)),
    };
  });
}

// @desc    Admin dashboard KPIs + daily series for charts
// @route   GET /api/orders/admin/dashboard
export const getAdminDashboard = asyncHandler(async (req, res) => {
  const dayKeys = lastNDaysIso(DAY_COUNT);
  const rangeStart = new Date(`${dayKeys[0]}T00:00:00.000Z`);

  const lowStockThreshold = Math.max(0, Number(process.env.LOW_STOCK_THRESHOLD) || 5);

  const [totalOrders, totalProducts, totalCategories, facetRows, dailyRows, lowStockCount, lowStockProducts] =
    await Promise.all([
      Order.countDocuments(),
      Product.countDocuments(),
      Category.countDocuments(),
      Order.aggregate([
        {
          $facet: {
            paidOrders: [{ $match: { isPaid: true, paymentStatus: { $ne: "canceled" } } }, { $count: "c" }],
            pendingPayment: [
              { $match: { isPaid: false, paymentStatus: { $in: ["pending", "failed"] } } },
              { $count: "c" },
            ],
            awaitingDispatch: [
              {
                $match: {
                  isPaid: true,
                  isDelivered: false,
                  paymentStatus: { $ne: "canceled" },
                },
              },
              { $count: "c" },
            ],
            revenue: [
              { $match: { isPaid: true, paymentStatus: { $ne: "canceled" } } },
              { $group: { _id: null, total: { $sum: "$totalPrice" } } },
            ],
          },
        },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: rangeStart } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
            count: { $sum: 1 },
            revenue: {
              $sum: {
                $cond: [
                  { $and: [{ $eq: ["$isPaid", true] }, { $ne: ["$paymentStatus", "canceled"] }] },
                  "$totalPrice",
                  0,
                ],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Product.countDocuments({ countInStock: { $lte: lowStockThreshold } }),
      Product.find({ countInStock: { $lte: lowStockThreshold } })
        .sort({ countInStock: 1 })
        .limit(12)
        .select("name countInStock _id")
        .lean(),
    ]);

  const facet = facetRows[0] || {};
  const paidOrders = facet.paidOrders?.[0]?.c ?? 0;
  const pendingPayment = facet.pendingPayment?.[0]?.c ?? 0;
  const awaitingDispatch = facet.awaitingDispatch?.[0]?.c ?? 0;
  const revenue = Number((facet.revenue?.[0]?.total ?? 0).toFixed(2));
  const series = buildSeries(dayKeys, dailyRows);

  res.json({
    totalOrders,
    totalProducts,
    totalCategories,
    revenue,
    paidOrders,
    pendingPayment,
    awaitingDispatch,
    series,
    chartDays: DAY_COUNT,
    lowStockThreshold,
    lowStockCount,
    lowStockProducts,
  });
});
