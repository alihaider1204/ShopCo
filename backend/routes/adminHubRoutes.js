import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  listCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../controllers/couponAdminController.js";
import { putAdminHero } from "../controllers/siteContentController.js";
import { listAdminCustomers } from "../controllers/adminUserController.js";
import {
  listNewsletterSubscribers,
  deleteNewsletterSubscriber,
  exportNewsletterCsv,
} from "../controllers/newsletterAdminController.js";
import {
  listCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from "../controllers/campaignAdminController.js";
import {
  listPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from "../controllers/purchaseOrderAdminController.js";
import { getTaxReportSummary, getFunnelSnapshot } from "../controllers/adminReportController.js";

const router = express.Router();
router.use(protect, admin);

router.get("/customers", listAdminCustomers);

router.get("/coupons", listCoupons);
router.post("/coupons", createCoupon);
router.put("/coupons/:id", updateCoupon);
router.delete("/coupons/:id", deleteCoupon);

router.put("/site-content/home_hero", putAdminHero);

router.get("/newsletter/subscribers", listNewsletterSubscribers);
router.delete("/newsletter/subscribers/:id", deleteNewsletterSubscriber);
router.get("/newsletter/export.csv", exportNewsletterCsv);

router.get("/campaigns", listCampaigns);
router.post("/campaigns", createCampaign);
router.put("/campaigns/:id", updateCampaign);
router.delete("/campaigns/:id", deleteCampaign);

router.get("/purchase-orders", listPurchaseOrders);
router.post("/purchase-orders", createPurchaseOrder);
router.put("/purchase-orders/:id", updatePurchaseOrder);
router.delete("/purchase-orders/:id", deletePurchaseOrder);

router.get("/reports/tax-summary", getTaxReportSummary);
router.get("/reports/funnel", getFunnelSnapshot);

export default router;
