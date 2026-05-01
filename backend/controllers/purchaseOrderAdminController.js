import asyncHandler from "express-async-handler";
import PurchaseOrder from "../models/PurchaseOrder.js";

export const listPurchaseOrders = asyncHandler(async (req, res) => {
  const items = await PurchaseOrder.find({}).sort({ createdAt: -1 }).limit(200).lean();
  res.json(items);
});

export const createPurchaseOrder = asyncHandler(async (req, res) => {
  const { reference, supplierName, status, notes, lines, totalEstimate } = req.body;
  if (!String(reference || "").trim() || !String(supplierName || "").trim()) {
    res.status(400);
    throw new Error("reference and supplierName are required");
  }
  const po = await PurchaseOrder.create({
    reference: String(reference).trim(),
    supplierName: String(supplierName).trim(),
    status: status || "draft",
    notes: notes ? String(notes).trim() : undefined,
    lines: Array.isArray(lines) ? lines : [],
    totalEstimate: Number(totalEstimate) || 0,
  });
  res.status(201).json(po);
});

export const updatePurchaseOrder = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) {
    res.status(404);
    throw new Error("Not found");
  }
  const { reference, supplierName, status, notes, lines, totalEstimate } = req.body;
  if (reference !== undefined) po.reference = String(reference).trim();
  if (supplierName !== undefined) po.supplierName = String(supplierName).trim();
  if (status !== undefined) po.status = status;
  if (notes !== undefined) po.notes = notes;
  if (lines !== undefined) po.lines = Array.isArray(lines) ? lines : po.lines;
  if (totalEstimate !== undefined) po.totalEstimate = Number(totalEstimate) || 0;
  await po.save();
  res.json(po);
});

export const deletePurchaseOrder = asyncHandler(async (req, res) => {
  const po = await PurchaseOrder.findById(req.params.id);
  if (!po) {
    res.status(404);
    throw new Error("Not found");
  }
  await po.deleteOne();
  res.json({ message: "Removed" });
});
