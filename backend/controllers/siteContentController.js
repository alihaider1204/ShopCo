import asyncHandler from "express-async-handler";
import SiteContent from "../models/SiteContent.js";

const HERO_KEY = "home_hero";

export const getPublicHero = asyncHandler(async (req, res) => {
  let doc = await SiteContent.findOne({ key: HERO_KEY }).lean();
  if (!doc) {
    await SiteContent.create({ key: HERO_KEY });
    doc = await SiteContent.findOne({ key: HERO_KEY }).lean();
  }
  res.json(doc);
});

export const putAdminHero = asyncHandler(async (req, res) => {
  const allowed = [
    "title",
    "subtitle",
    "heroImageUrl",
    "ctaLabel",
    "ctaHref",
    "stat1Num",
    "stat1Label",
    "stat2Num",
    "stat2Label",
    "stat3Num",
    "stat3Label",
  ];
  const $set = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) $set[k] = req.body[k];
  }
  const doc = await SiteContent.findOneAndUpdate(
    { key: HERO_KEY },
    { $set, $setOnInsert: { key: HERO_KEY } },
    { new: true, upsert: true }
  );
  res.json(doc);
});
