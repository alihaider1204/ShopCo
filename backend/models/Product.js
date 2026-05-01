import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    rating: { type: Number, required: true },
    comment: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    /** Set only by seed script so reruns can remove seeded testimonials cleanly */
    seedBatch: { type: String },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    image: { type: String, required: true },
    images: [{ type: String }],
    brand: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    description: { type: String, required: true },
    reviews: [reviewSchema],
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    price: { type: Number, required: true, default: 0 },
    /** When set, UI shows strike-through original and discount badge */
    originalPrice: { type: Number },
    countInStock: { type: Number, required: true, default: 0 },
    colors: [{ type: String }],
    sizes: [{ type: String }],
    dressStyle: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    /** Set by seedHomepageProducts.js so reruns can replace seeded catalog rows */
    homepageSeedKey: { type: String },
  },
  { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
