import mongoose from "mongoose";

const poLineSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true },
    qty: { type: Number, required: true, min: 1 },
    unitCost: { type: Number, default: 0 },
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  },
  { _id: true }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    reference: { type: String, required: true, trim: true },
    supplierName: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["draft", "ordered", "in_transit", "received", "cancelled"],
      default: "draft",
    },
    notes: { type: String, trim: true, maxlength: 8000 },
    lines: [poLineSchema],
    totalEstimate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const PurchaseOrder = mongoose.model("PurchaseOrder", purchaseOrderSchema);

export default PurchaseOrder;
