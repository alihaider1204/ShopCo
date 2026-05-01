/**
 * Seeds ~18 homepage testimonials on existing products (Pakistani names, realistic copy).
 * Idempotent: removes reviews with seedBatch "pk-homepage-v1" then re-inserts.
 *
 * Usage (from backend/):  npm run seed:reviews
 * Requires MONGO_URI in .env and at least one product (run npm run seed:products first).
 * One-shot:             npm run seed:all
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import User from "../models/User.js";

dotenv.config();

const SEED_BATCH = "pk-homepage-v1";
const SEED_PASSWORD = "SeedReviewerLocalOnly2026!";

const ENTRIES = [
  {
    firstName: "Ayesha",
    lastName: "Khan",
    name: "Ayesha K.",
    rating: 5,
    comment:
      "Ordered a stitched kurta for Eid — fabric quality is honestly better than what I expected. Delivery to Karachi was on time and packing was neat. Will shop again inshaAllah.",
  },
  {
    firstName: "Bilal",
    lastName: "Ahmed",
    name: "Bilal A.",
    rating: 5,
    comment:
      "Jeans ki fitting spot-on hai. I'm usually between sizes but size chart ne kaam aa gaya. Happy with the stretch and colour after two washes.",
  },
  {
    firstName: "Fatima",
    lastName: "Noor",
    name: "Fatima N.",
    rating: 5,
    comment:
      "Dupatta fabric is soft and doesn't feel cheap at all. Colours match the photos — rarely happens online. My Ammi also liked it.",
  },
  {
    firstName: "Hassan",
    lastName: "Ali",
    name: "Hassan A.",
    rating: 4,
    comment:
      "Good experience overall. Ordered from Islamabad — courier took one extra day but CS replied quickly on WhatsApp and tracked it properly.",
  },
  {
    firstName: "Zainab",
    lastName: "Malik",
    name: "Zainab M.",
    rating: 5,
    comment:
      "Bought kids’ tees for my nephews — prints are cute and cotton feels breathable for Lahore summers. Washing instructions helped.",
  },
  {
    firstName: "Omar",
    lastName: "Farooq",
    name: "Omar F.",
    rating: 5,
    comment:
      "Had to exchange size once — return process was straightforward, no drama. Replacement jacket arrived before I expected.",
  },
  {
    firstName: "Sana",
    lastName: "Sheikh",
    name: "Sana S.",
    rating: 5,
    comment:
      "Winter hoodie is thick enough for Murree evenings without looking bulky. Zip quality is solid — small detail but matters.",
  },
  {
    firstName: "Usman",
    lastName: "Bashir",
    name: "Usman B.",
    rating: 4,
    comment:
      "Stitching on shalwar side seams is clean — I've had bad luck with online tailoring-ish pieces before. This one passed.",
  },
  {
    firstName: "Hira",
    lastName: "Tariq",
    name: "Hira T.",
    rating: 5,
    comment:
      "Checkout was smooth, payment went through on first try (sometimes banks fail for no reason!). Tracking link worked fine.",
  },
  {
    firstName: "Imran",
    lastName: "Qureshi",
    name: "Imran Q.",
    rating: 5,
    comment:
      "Gift-wrapped for my sister’s birthday — ribbon and note looked nice, not tacky. She actually asked where I ordered from.",
  },
  {
    firstName: "Maryam",
    lastName: "Siddiqui",
    name: "Maryam S.",
    rating: 5,
    comment:
      "Sale price felt fair for the shirt — same stuff I saw pricier elsewhere in Saddar. Fabric hasn’t faded yet.",
  },
  {
    firstName: "Saad",
    lastName: "Mahmood",
    name: "Saad M.",
    rating: 4,
    comment:
      "Customer care answered sizing questions patiently (sent shoulder measurements). Shirt fits well — small sleeve tweak would make it 5 stars.",
  },
  {
    firstName: "Nida",
    lastName: "Hussain",
    name: "Nida H.",
    rating: 5,
    comment:
      "Sizing chart matched my measurements — finally no guessing between medium and large. Dress sits well on frame.",
  },
  {
    firstName: "Waleed",
    lastName: "Akram",
    name: "Waleed A.",
    rating: 5,
    comment:
      "Karachi heat ke liye lightweight cotton kurta perfect — airy without being see-through. Stitching at collar held after washes.",
  },
  {
    firstName: "Rabia",
    lastName: "Iqbal",
    name: "Rabia I.",
    rating: 5,
    comment:
      "Party wear dress arrived two days before the wedding — cutting it close but they delivered. Embroidery detail looks premium in person.",
  },
  {
    firstName: "Danish",
    lastName: "Khan",
    name: "Danish K.",
    rating: 5,
    comment:
      "Tracksuit for gym — waistband doesn't roll down mid-set and fabric wicks sweat okay for indoor AC gyms in Faisalabad.",
  },
  {
    firstName: "Amna",
    lastName: "Javed",
    name: "Amna J.",
    rating: 5,
    comment:
      "Unstitched suit cloth colour is rich — tailor said yardage was sufficient with margin. Happy with dupatta length.",
  },
  {
    firstName: "Fahad",
    lastName: "Mirza",
    name: "Fahad M.",
    rating: 4,
    comment:
      "Shoes looked legit compared to mall pairs I've owned — sole grip on tiled floors is fine. Box came a bit dented but shoes OK.",
  },
];

function syncRatings(product) {
  const n = product.reviews.length;
  product.numReviews = n;
  product.rating = n ? product.reviews.reduce((acc, r) => acc + r.rating, 0) / n : 0;
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("Missing MONGO_URI in .env");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const products = await Product.find({}).select("_id reviews").lean();
  if (!products.length) {
    console.error("No products found — add products first, then run this seed again.");
    process.exit(1);
  }

  const productDocs = await Product.find({});
  for (const p of productDocs) {
    p.reviews = p.reviews.filter((r) => r.seedBatch !== SEED_BATCH);
    syncRatings(p);
    await p.save();
  }

  const emailsDeleted = await User.deleteMany({
    email: { $regex: /^pk\.seed\.review\.\d+@local\.seed$/ },
  });
  if (emailsDeleted.deletedCount) {
    console.log(`Removed ${emailsDeleted.deletedCount} previous seed reviewer accounts.`);
  }

  const insertedUsers = [];
  for (let i = 0; i < ENTRIES.length; i++) {
    const e = ENTRIES[i];
    const u = await User.create({
      firstName: e.firstName,
      lastName: e.lastName,
      email: `pk.seed.review.${String(i + 1).padStart(2, "0")}@local.seed`,
      password: SEED_PASSWORD,
    });
    insertedUsers.push(u);
  }
  console.log(`Inserted ${insertedUsers.length} reviewer user accounts.`);

  const byProduct = new Map();
  for (let i = 0; i < ENTRIES.length; i++) {
    const e = ENTRIES[i];
    const pIdx = i % products.length;
    const pid = products[pIdx]._id.toString();
    if (!byProduct.has(pid)) byProduct.set(pid, []);
    byProduct.get(pid).push({
      name: e.name,
      rating: e.rating,
      comment: e.comment,
      user: insertedUsers[i]._id,
      seedBatch: SEED_BATCH,
    });
  }

  let added = 0;
  for (const [pidStr, revs] of byProduct) {
    const product = await Product.findById(pidStr);
    if (!product) continue;
    for (const r of revs) {
      product.reviews.push(r);
      added++;
    }
    syncRatings(product);
    await product.save();
  }

  console.log(`Attached ${added} reviews (${SEED_BATCH}) across ${byProduct.size} products.`);
  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
