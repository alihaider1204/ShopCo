import asyncHandler from "express-async-handler";
import User from "../models/User.js";
import Order from "../models/Order.js";

export const listAdminCustomers = asyncHandler(async (req, res) => {
  const segment = String(req.query.segment || "all");
  const buyers = await User.find({ role: "buyer" })
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  const paidStats = await Order.aggregate([
    { $match: { user: { $ne: null }, isPaid: true, paymentStatus: { $ne: "canceled" } } },
    {
      $group: {
        _id: "$user",
        orderCount: { $sum: 1 },
        lifetimeSpent: { $sum: "$totalPrice" },
      },
    },
  ]);
  const map = new Map(paidStats.map((s) => [String(s._id), s]));

  let rows = buyers.map((u) => {
    const s = map.get(String(u._id));
    return {
      ...u,
      orderCount: s?.orderCount ?? 0,
      lifetimeSpent: Number((s?.lifetimeSpent ?? 0).toFixed(2)),
    };
  });

  if (segment === "with_orders") rows = rows.filter((r) => r.orderCount > 0);
  if (segment === "newsletter") rows = rows.filter((r) => r.preferences?.newsletter);
  if (segment === "high_value") rows = rows.filter((r) => r.lifetimeSpent >= 500);

  res.json(rows);
});
