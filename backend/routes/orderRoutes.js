import express from "express";
import rateLimit from "express-rate-limit";
import {
  addOrderItems,
  addGuestOrderItems,
  getMyOrders,
  getGuestOrderById,
  getOrderById,
  updateOrderToPaid,
  syncOrderPayment,
  syncGuestOrderPayment,
  markPaymentFailed,
  markGuestPaymentFailed,
  getOrderInvoice,
  getGuestOrderInvoice,
  getAdminOrderStats,
  getAdminOrders,
  getAdminOrderById,
  getAdminOrderInvoice,
  updateOrderDelivered,
  cancelAdminOrder,
  validateCouponPublic,
  updateAdminOrderShipment,
  addAdminOrderNote,
  adminRefundStripeOrder,
  exportAdminOrdersCsv,
} from "../controllers/orderController.js";
import { getAdminDashboard } from "../controllers/adminDashboardController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

/** Only real Mongo ObjectIds match — avoids /admin/dashboard being handled as /admin/:id */
const ADMIN_OID = ":id([a-fA-F0-9]{24})";

const couponValidateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 80,
  message: { message: "Too many coupon checks. Try again shortly." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.route("/").post(protect, addOrderItems);
router.post("/guest", addGuestOrderItems);
router.route("/myorders").get(protect, getMyOrders);

router.post("/validate-coupon", couponValidateLimiter, validateCouponPublic);

router.get("/admin/stats", protect, admin, getAdminOrderStats);
router.get("/admin/dashboard", protect, admin, getAdminDashboard);
router.get("/admin/export/csv", protect, admin, exportAdminOrdersCsv);
router.get("/admin/all", protect, admin, getAdminOrders);
router.get(`/admin/${ADMIN_OID}/invoice`, protect, admin, getAdminOrderInvoice);
router.put(`/admin/${ADMIN_OID}/delivered`, protect, admin, updateOrderDelivered);
router.put(`/admin/${ADMIN_OID}/shipment`, protect, admin, updateAdminOrderShipment);
router.post(`/admin/${ADMIN_OID}/notes`, protect, admin, addAdminOrderNote);
router.post(`/admin/${ADMIN_OID}/refund`, protect, admin, adminRefundStripeOrder);
router.put(`/admin/${ADMIN_OID}/cancel`, protect, admin, cancelAdminOrder);
router.get(`/admin/${ADMIN_OID}`, protect, admin, getAdminOrderById);

router.get("/guest/:id", getGuestOrderById);

router.get("/:id/invoice-guest", getGuestOrderInvoice);
router.post("/:id/sync-payment-guest", syncGuestOrderPayment);
router.put("/:id/payment-failed-guest", markGuestPaymentFailed);

router.route("/:id/invoice").get(protect, getOrderInvoice);
router.route("/:id/sync-payment").post(protect, syncOrderPayment);
router.route("/:id/payment-failed").put(protect, markPaymentFailed);
router.route("/:id").get(protect, getOrderById);
router.route("/:id/pay").put(protect, updateOrderToPaid);

export default router;
