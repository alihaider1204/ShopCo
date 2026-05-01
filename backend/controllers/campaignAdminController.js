import asyncHandler from "express-async-handler";
import CampaignLog from "../models/CampaignLog.js";

export const listCampaigns = asyncHandler(async (req, res) => {
  const items = await CampaignLog.find({}).sort({ createdAt: -1 }).limit(200).lean();
  res.json(items);
});

export const createCampaign = asyncHandler(async (req, res) => {
  const { name, channel, segment, notes, status, scheduledFor, completedAt } = req.body;
  if (!String(name || "").trim()) {
    res.status(400);
    throw new Error("Campaign name is required");
  }
  const c = await CampaignLog.create({
    name: String(name).trim(),
    channel: channel || "email",
    segment: segment ? String(segment).trim() : undefined,
    notes: notes ? String(notes).trim() : undefined,
    status: status || "draft",
    scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
    completedAt: completedAt ? new Date(completedAt) : undefined,
  });
  res.status(201).json(c);
});

export const updateCampaign = asyncHandler(async (req, res) => {
  const c = await CampaignLog.findById(req.params.id);
  if (!c) {
    res.status(404);
    throw new Error("Not found");
  }
  const { name, channel, segment, notes, status } = req.body;
  if (name !== undefined) c.name = String(name).trim();
  if (channel !== undefined) c.channel = channel;
  if (segment !== undefined) c.segment = segment;
  if (notes !== undefined) c.notes = notes;
  if (status !== undefined) c.status = status;
  if (req.body.scheduledFor !== undefined) {
    c.scheduledFor = req.body.scheduledFor ? new Date(req.body.scheduledFor) : undefined;
  }
  if (req.body.completedAt !== undefined) {
    c.completedAt = req.body.completedAt ? new Date(req.body.completedAt) : undefined;
  }
  await c.save();
  res.json(c);
});

export const deleteCampaign = asyncHandler(async (req, res) => {
  const c = await CampaignLog.findById(req.params.id);
  if (!c) {
    res.status(404);
    throw new Error("Not found");
  }
  await c.deleteOne();
  res.json({ message: "Removed" });
});
