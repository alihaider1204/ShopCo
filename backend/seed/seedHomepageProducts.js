/**
 * Seeds the 8 homepage catalog items (same names / prices as New Arrivals + Top Selling mocks).
 * Copies PNGs from frontend/src/assets into frontend/public/seed-products/ and stores
 * image URLs like /seed-products/<slug>.png (served by Vite static public/).
 *
 * Usage (from backend/):  npm run seed:products
 * Then:                  npm run seed:reviews
 * Or both:                npm run seed:all
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import { copyFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

import Product from "../models/Product.js";
import Category from "../models/Category.js";
import User from "../models/User.js";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = join(__dirname, "../../frontend");
const ASSETS_DIR = join(FRONTEND_ROOT, "src/assets");
const PUBLIC_SEED_DIR = join(FRONTEND_ROOT, "public/seed-products");

const SEED_KEY = "homepage-products-v1";
const SEED_ADMIN_EMAIL = "admin.seed@shop.co";
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "AdminSeedLocal123!";

/**
 * Same filenames as frontend/src/assets (see NewArrivals.jsx & TopSelling.jsx).
 * Must match PNG files on disk (spaces preserved).
 */
const HOMEPAGE_PRODUCTS = [
  {
    name: "T-shirt with Tape Details",
    assetFile: "T-SHIRT WITH TAPE DETAILS.png",
    slug: "t-shirt-with-tape-details",
    brand: "SHOP.CO",
    categoryName: "T-Shirts",
    price: 120,
    originalPrice: undefined,
    rating: 4.5,
    numReviews: 18,
    dressStyle: "Casual",
    colors: ["Black", "White", "Navy"],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Soft cotton tee with contrast tape detail at shoulders. Everyday casual fit — matches our homepage hero range.",
  },
  {
    name: "Skinny Fit Jeans",
    assetFile: "SKINNY FIT JEANS.png",
    slug: "skinny-fit-jeans",
    brand: "SHOP.CO",
    categoryName: "Jeans",
    price: 240,
    originalPrice: 260,
    rating: 3.5,
    numReviews: 42,
    dressStyle: "Casual",
    colors: ["Light Blue", "Black"],
    sizes: ["28", "30", "32", "34", "36"],
    description:
      "Stretch skinny jeans with a clean wash. Slim through hip and thigh — as shown on the homepage mock.",
  },
  {
    name: "Checkered Shirt",
    assetFile: "CHECKERED SHIRT.png",
    slug: "checkered-shirt",
    brand: "SHOP.CO",
    categoryName: "Shirts",
    price: 180,
    originalPrice: undefined,
    rating: 4.5,
    numReviews: 31,
    dressStyle: "Casual",
    colors: ["Blue/White", "Black/White"],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Classic check pattern, button-down collar. Easy to dress up or down for Karachi–Lahore weather.",
  },
  {
    name: "Sleeve Striped T-shirt",
    assetFile: "SLEEVE STRIPED T-SHIRT.png",
    slug: "sleeve-striped-t-shirt",
    brand: "SHOP.CO",
    categoryName: "T-Shirts",
    price: 130,
    originalPrice: 160,
    rating: 4.5,
    numReviews: 27,
    dressStyle: "Casual",
    colors: ["Navy", "Grey"],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Striped sleeves with solid body — breathable jersey cotton for daily wear.",
  },
  {
    name: "Vertical Striped Shirt",
    assetFile: "VERTICAL STRIPED SHIRT.png",
    slug: "vertical-striped-shirt",
    brand: "SHOP.CO",
    categoryName: "Shirts",
    price: 212,
    originalPrice: 232,
    rating: 5,
    numReviews: 56,
    dressStyle: "Formal",
    colors: ["Blue", "Grey"],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Vertical stripes for a taller silhouette; office-ready when tucked in.",
  },
  {
    name: "Courage Graphic T-shirt",
    assetFile: "COURAGE GRAPHIC T-SHIRT.png",
    slug: "courage-graphic-t-shirt",
    brand: "SHOP.CO",
    categoryName: "T-Shirts",
    price: 145,
    originalPrice: undefined,
    rating: 4,
    numReviews: 22,
    dressStyle: "Party",
    colors: ["Black", "White"],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Bold graphic print with soft hand-feel. Statement piece for weekends and events.",
  },
  {
    name: "Loose Fit Bermuda Shorts",
    assetFile: "LOOSE FIT BERMUDA SHORTS.png",
    slug: "loose-fit-bermuda-shorts",
    brand: "SHOP.CO",
    categoryName: "Shorts",
    price: 80,
    originalPrice: undefined,
    rating: 3,
    numReviews: 14,
    dressStyle: "Gym",
    colors: ["Khaki", "Black", "Navy"],
    sizes: ["S", "M", "L", "XL"],
    description:
      "Relaxed bermuda length with elastic waist option. Ideal for gym or relaxed streetwear.",
  },
  {
    name: "Faded Skinny Jeans",
    assetFile: "FADED SKINNY JEANS.png",
    slug: "faded-skinny-jeans",
    brand: "SHOP.CO",
    categoryName: "Jeans",
    price: 210,
    originalPrice: undefined,
    rating: 4.5,
    numReviews: 39,
    dressStyle: "Casual",
    colors: ["Faded Blue", "Grey"],
    sizes: ["28", "30", "32", "34", "36"],
    description:
      "Light faded wash with skinny cut. Pairs well with tees and trainers.",
  },
];

async function ensureCategory(name) {
  let cat = await Category.findOne({ name });
  if (!cat) {
    cat = await Category.create({
      name,
      description: `${name} — seeded for homepage catalog`,
    });
  }
  return cat._id;
}

async function ensureAdminUser() {
  let user = await User.findOne({ isAdmin: true });
  if (user) return user._id;

  const existing = await User.findOne({ email: SEED_ADMIN_EMAIL });
  if (existing) {
    existing.isAdmin = true;
    existing.role = "admin";
    await existing.save();
    return existing._id;
  }

  const created = await User.create({
    firstName: "Seed",
    lastName: "Admin",
    email: SEED_ADMIN_EMAIL,
    password: SEED_ADMIN_PASSWORD,
    isAdmin: true,
    role: "admin",
  });
  return created._id;
}

async function copyAssetToPublic(assetFile, slug) {
  const src = join(ASSETS_DIR, assetFile);
  if (!existsSync(src)) {
    throw new Error(`Missing asset file: ${src}`);
  }
  await mkdir(PUBLIC_SEED_DIR, { recursive: true });
  const dest = join(PUBLIC_SEED_DIR, `${slug}.png`);
  await copyFile(src, dest);
  return `/seed-products/${slug}.png`;
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const deleted = await Product.deleteMany({ homepageSeedKey: SEED_KEY });
  if (deleted.deletedCount) {
    console.log(`Removed ${deleted.deletedCount} previous homepage seed products.`);
  }

  const adminId = await ensureAdminUser();
  console.log("Using admin user ObjectId for product.owner:", String(adminId));

  const categoryCache = new Map();
  async function catId(name) {
    if (!categoryCache.has(name)) {
      categoryCache.set(name, await ensureCategory(name));
    }
    return categoryCache.get(name);
  }

  let copied = 0;
  for (const row of HOMEPAGE_PRODUCTS) {
    const imageUrl = await copyAssetToPublic(row.assetFile, row.slug);
    copied++;

    await Product.create({
      name: row.name,
      image: imageUrl,
      images: [imageUrl],
      brand: row.brand,
      category: await catId(row.categoryName),
      description: row.description,
      price: row.price,
      originalPrice: row.originalPrice,
      countInStock: 75,
      colors: row.colors,
      sizes: row.sizes,
      dressStyle: row.dressStyle,
      rating: row.rating,
      numReviews: row.numReviews,
      reviews: [],
      user: adminId,
      homepageSeedKey: SEED_KEY,
    });

    console.log(`  ✓ ${row.name} → ${imageUrl}`);
  }

  console.log(`\nDone: ${HOMEPAGE_PRODUCTS.length} products, ${copied} images copied to frontend/public/seed-products/`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
