import express from "express";
import {
  getProducts,
  getAdminProducts,
  getFeaturedReviews,
  getProductById,
  getProductReviews,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  bulkUpdateProductStock,
} from "../controllers/productController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/featured-reviews", getFeaturedReviews);
router.get("/admin/all", protect, admin, getAdminProducts);
router.route("/").get(getProducts).post(protect, admin, createProduct);
router.put("/bulk-stock", protect, admin, bulkUpdateProductStock);
router.get("/:id/reviews", getProductReviews);
router.post("/:id/reviews", protect, createProductReview);
router.route("/:id").get(getProductById).put(protect, admin, updateProduct).delete(protect, admin, deleteProduct);

export default router;
