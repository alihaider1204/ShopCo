import asyncHandler from "express-async-handler";
import mongoose from "mongoose";
import Product from "../models/Product.js";
import Category from "../models/Category.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// @desc    Get products (filters, search, sort, pagination)
// @route   GET /api/products
export const getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
  const keyword = (req.query.keyword || "").trim();
  const minPrice = req.query.minPrice !== undefined && req.query.minPrice !== "" ? Number(req.query.minPrice) : undefined;
  const maxPrice = req.query.maxPrice !== undefined && req.query.maxPrice !== "" ? Number(req.query.maxPrice) : undefined;
  const categoryParam = (req.query.category || "").trim();
  const dressStyle = (req.query.dressStyle || "").trim();
  const color = (req.query.color || "").trim();
  const colorsParam = (req.query.colors || "").trim();
  const size = (req.query.size || "").trim();
  const onSaleRaw = String(req.query.onSale ?? req.query.sale ?? "").toLowerCase();
  const onSale = onSaleRaw === "true" || onSaleRaw === "1";

  const filter = {};

  if (keyword) {
    const rx = escapeRegex(keyword);
    filter.$or = [
      { name: { $regex: rx, $options: "i" } },
      { brand: { $regex: rx, $options: "i" } },
      { description: { $regex: rx, $options: "i" } },
    ];
  }

  if (dressStyle) {
    filter.dressStyle = { $regex: new RegExp(`^${escapeRegex(dressStyle)}$`, "i") };
  }

  if (categoryParam) {
    if (mongoose.Types.ObjectId.isValid(categoryParam)) {
      filter.category = categoryParam;
    } else {
      const cat = await Category.findOne({
        name: new RegExp(`^${escapeRegex(categoryParam)}$`, "i"),
      });
      if (!cat) {
        return res.json({ products: [], page: 1, pages: 0, total: 0 });
      }
      filter.category = cat._id;
    }
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined && !Number.isNaN(minPrice)) filter.price.$gte = minPrice;
    if (maxPrice !== undefined && !Number.isNaN(maxPrice)) filter.price.$lte = maxPrice;
  }

  const colorList = colorsParam
    ? colorsParam.split(",").map((c) => c.trim()).filter(Boolean)
    : color
      ? [color]
      : [];
  if (colorList.length === 1) {
    filter.colors = colorList[0];
  } else if (colorList.length > 1) {
    filter.colors = { $in: colorList };
  }

  if (size) {
    filter.sizes = size;
  }

  if (onSale) {
    filter.$expr = {
      $and: [
        { $gt: [{ $ifNull: ["$originalPrice", 0] }, 0] },
        { $gt: ["$originalPrice", "$price"] },
      ],
    };
  }

  let sort = { rating: -1 };
  switch (req.query.sort) {
    case "price_asc":
      sort = { price: 1 };
      break;
    case "price_desc":
      sort = { price: -1 };
      break;
    case "newest":
      sort = { createdAt: -1 };
      break;
    case "popular":
    default:
      sort = { rating: -1 };
      break;
  }

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate("category", "name")
    .sort(sort)
    .limit(limit)
    .skip((page - 1) * limit);

  res.json({
    products,
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
  });
});

// @desc    Admin product list (search + higher limit; auth on route)
// @route   GET /api/products/admin/all
export const getAdminProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 200));
  const keyword = (req.query.keyword || "").trim();
  const filter = {};
  if (keyword) {
    const rx = escapeRegex(keyword);
    filter.$or = [
      { name: { $regex: rx, $options: "i" } },
      { brand: { $regex: rx, $options: "i" } },
      { description: { $regex: rx, $options: "i" } },
    ];
  }
  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate("category", "name")
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
  res.json({
    products,
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
  });
});

// @desc    Featured reviews across all products (homepage carousel)
// @route   GET /api/products/featured-reviews
export const getFeaturedReviews = asyncHandler(async (req, res) => {
  const limit = Math.min(40, Math.max(1, Number(req.query.limit) || 20));
  const rows = await Product.aggregate([
    { $unwind: "$reviews" },
    { $sort: { "reviews.createdAt": -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        name: "$reviews.name",
        rating: "$reviews.rating",
        comment: "$reviews.comment",
        createdAt: "$reviews.createdAt",
      },
    },
  ]);
  res.json({ reviews: rows });
});

// @desc    Get single product
// @route   GET /api/products/:id
export const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).populate("category", "name description image");
  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Paginated reviews for a product
// @route   GET /api/products/:id/reviews
export const getProductReviews = asyncHandler(async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 8));

  const product = await Product.findById(req.params.id).select("reviews");
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }

  const sorted = [...product.reviews].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  const total = sorted.length;
  const start = (page - 1) * limit;
  const reviews = sorted.slice(start, start + limit);

  res.json({
    reviews,
    page,
    pages: Math.ceil(total / limit) || 1,
    total,
  });
});

// @desc    Create a product (admin)
// @route   POST /api/products
export const createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    price,
    description,
    image,
    brand,
    category,
    countInStock,
    colors,
    sizes,
    dressStyle,
    originalPrice,
  } = req.body;

  const sizesArr = Array.isArray(sizes)
    ? sizes.map((s) => String(s).trim()).filter(Boolean)
    : typeof sizes === "string"
      ? sizes.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  if (!sizesArr.length) {
    res.status(400);
    throw new Error("At least one size is required");
  }

  const product = new Product({
    name,
    price: Number(price),
    user: req.user._id,
    image,
    brand,
    category,
    countInStock: countInStock !== undefined ? Number(countInStock) : 0,
    numReviews: 0,
    description,
    colors: Array.isArray(colors) ? colors : typeof colors === "string" ? colors.split(",").map((c) => c.trim()).filter(Boolean) : [],
    sizes: sizesArr,
    dressStyle: dressStyle || "",
    originalPrice: originalPrice !== undefined && originalPrice !== "" ? Number(originalPrice) : undefined,
  });

  const createdProduct = await product.save();
  const populated = await Product.findById(createdProduct._id).populate("category", "name");
  res.status(201).json(populated);
});

const normalizeColorSizeList = (val, fallback) => {
  if (val === undefined) return fallback;
  if (Array.isArray(val)) return val;
  if (typeof val === "string") return val.split(",").map((x) => x.trim()).filter(Boolean);
  return fallback;
};

// @desc    Update a product (admin)
// @route   PUT /api/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
  const { name, price, description, image, brand, category, countInStock, colors, sizes, dressStyle, originalPrice } = req.body;
  const product = await Product.findById(req.params.id);
  if (product) {
    product.name = name ?? product.name;
    product.price = price !== undefined ? Number(price) : product.price;
    product.description = description ?? product.description;
    product.image = image ?? product.image;
    product.brand = brand ?? product.brand;
    product.category = category ?? product.category;
    product.countInStock = countInStock !== undefined ? Number(countInStock) : product.countInStock;
    product.colors = normalizeColorSizeList(colors, product.colors);
    const nextSizes = normalizeColorSizeList(sizes, product.sizes);
    if (!nextSizes.length) {
      res.status(400);
      throw new Error("At least one size is required");
    }
    product.sizes = nextSizes;
    product.dressStyle = dressStyle ?? product.dressStyle;
    product.originalPrice =
      originalPrice !== undefined && originalPrice !== ""
        ? Number(originalPrice)
        : originalPrice === "" || originalPrice === null
          ? undefined
          : product.originalPrice;
    const updatedProduct = await product.save();
    const populated = await Product.findById(updatedProduct._id).populate("category", "name");
    res.json(populated);
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

// @desc    Bulk update stock (admin)
// @route   PUT /api/products/bulk-stock
export const bulkUpdateProductStock = asyncHandler(async (req, res) => {
  const { updates } = req.body;
  if (!Array.isArray(updates) || updates.length === 0) {
    res.status(400);
    throw new Error("updates array is required");
  }
  if (updates.length > 200) {
    res.status(400);
    throw new Error("Maximum 200 updates per request");
  }
  let n = 0;
  for (const u of updates) {
    const id = u.id || u._id;
    const stock = Number(u.countInStock);
    if (!id || !mongoose.Types.ObjectId.isValid(id) || !Number.isFinite(stock) || stock < 0) {
      continue;
    }
    await Product.findByIdAndUpdate(id, { countInStock: Math.floor(stock) });
    n += 1;
  }
  res.json({ updated: n });
});

// @desc    Delete a product (admin)
// @route   DELETE /api/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (product) {
    await Product.deleteOne({ _id: product._id });
    res.json({ message: "Product removed" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});

const reviewerName = (user) => {
  if (user.firstName || user.lastName) {
    return [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  }
  return user.email || "Customer";
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
export const createProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const product = await Product.findById(req.params.id);
  if (product) {
    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );
    if (alreadyReviewed) {
      res.status(400);
      throw new Error("Product already reviewed");
    }
    const review = {
      name: reviewerName(req.user),
      rating: Number(rating),
      comment,
      user: req.user._id,
    };
    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;
    await product.save();
    res.status(201).json({ message: "Review added" });
  } else {
    res.status(404);
    throw new Error("Product not found");
  }
});
