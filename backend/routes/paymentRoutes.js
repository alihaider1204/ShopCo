import express from "express";
import { createPaymentIntent, createGuestPaymentIntent } from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create-payment-intent", protect, createPaymentIntent);
router.post("/create-payment-intent-guest", createGuestPaymentIntent);

export default router;
