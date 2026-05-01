import mongoose from "mongoose";

/** Keyed storefront CMS blobs (e.g. home hero). */
const siteContentSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, trim: true },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    heroImageUrl: { type: String, default: "" },
    ctaLabel: { type: String, default: "" },
    ctaHref: { type: String, default: "/products" },
    stat1Num: { type: String, default: "200+" },
    stat1Label: { type: String, default: "International Brands" },
    stat2Num: { type: String, default: "2,000+" },
    stat2Label: { type: String, default: "High-Quality Products" },
    stat3Num: { type: String, default: "30,000+" },
    stat3Label: { type: String, default: "Happy Customers" },
  },
  { timestamps: true }
);

const SiteContent = mongoose.model("SiteContent", siteContentSchema);

export default SiteContent;
