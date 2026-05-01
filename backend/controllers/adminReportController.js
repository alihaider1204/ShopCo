import asyncHandler from "express-async-handler";
import Order from "../models/Order.js";

export const getTaxReportSummary = asyncHandler(async (req, res) => {
  const rows = await Order.aggregate([
    { $match: { isPaid: true, paymentStatus: { $ne: "canceled" } } },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "UTC" },
        },
        orders: { $sum: 1 },
        gross: { $sum: "$totalPrice" },
        tax: { $sum: "$taxPrice" },
        shipping: { $sum: "$shippingPrice" },
        netItems: { $sum: "$itemsPrice" },
      },
    },
    { $sort: { _id: -1 } },
    { $limit: 36 },
  ]);
  const normalized = rows.map((r) => ({
    month: r._id,
    orders: r.orders,
    gross: Number(r.gross.toFixed(2)),
    taxCollected: Number(r.tax.toFixed(2)),
    shipping: Number(r.shipping.toFixed(2)),
    netItems: Number(r.netItems.toFixed(2)),
  }));
  res.json(normalized);
});

export const getFunnelSnapshot = asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 864e5);
  const [ordersAllTime, orders30, paid30, revenueAgg] = await Promise.all([
    Order.countDocuments({}),
    Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    Order.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      isPaid: true,
      paymentStatus: { $ne: "canceled" },
    }),
    Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          isPaid: true,
          paymentStatus: { $ne: "canceled" },
        },
      },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]),
  ]);
  const revenue30 = Number((revenueAgg[0]?.total ?? 0).toFixed(2));
  res.json({
    note: "Approximate storefront signals without on-site analytics",
    ordersAllTime,
    ordersLast30Days: orders30,
    paidOrdersLast30Days: paid30,
    paidRevenueLast30Days: revenue30,
    conversionHint:
      paid30 && orders30 ? `${((paid30 / orders30) * 100).toFixed(1)}% of new orders (30d) reached paid` : null,
  });
});
