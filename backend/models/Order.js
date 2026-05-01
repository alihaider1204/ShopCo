import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    color: { type: String },
    size: { type: String },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    isGuest: { type: Boolean, default: false },
    /** SHA-256 of secret token; plain token shown once to client at guest checkout */
    guestCheckoutTokenHash: { type: String },
    guestEmail: { type: String },
    orderItems: [orderItemSchema],
    shippingAddress: {
      fullName: { type: String },
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: { type: String, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "canceled"],
      default: "pending",
    },
    stripePaymentIntentId: { type: String },
    confirmationEmailSent: { type: Boolean, default: false },
    receiptEmail: { type: String },
    /** Stock decremented once after successful payment */
    inventoryAdjusted: { type: Boolean, default: false },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
      receipt_url: { type: String },
    },
    itemsPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
    /** Carrier display name, e.g. UPS / FedEx / USPS / Other */
    shippingCarrier: { type: String, trim: true },
    trackingNumber: { type: String, trim: true },
    /** Optional deep link for branded tracking (if known) */
    trackingUrl: { type: String, trim: true },
    adminNotes: [
      {
        text: { type: String, required: true, maxlength: 4000 },
        createdAt: { type: Date, default: Date.now },
        authorLabel: { type: String, trim: true },
      },
    ],
    couponCode: { type: String, trim: true, uppercase: true },
    discountAmount: { type: Number, default: 0 },
    /** Pre-discount items subtotal (same as cart sum of line items before coupon) */
    itemsPriceSubtotal: { type: Number },
    stripeRefundId: { type: String, trim: true },
    refundedAmount: { type: Number },
    refundedAt: { type: Date },
    /** Prevents double-incrementing coupon.usedCount if sync runs twice */
    couponUsageRecorded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;
