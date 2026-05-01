import asyncHandler from "express-async-handler";
import Category from "../models/Category.js";

// @desc    Get all categories
// @route   GET /api/categories
export const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({});
  res.json(categories);
});

// @desc    Get single category
// @route   GET /api/categories/:id
export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  res.json(category);
});

// @desc    Create a category (admin)
// @route   POST /api/categories
export const createCategory = asyncHandler(async (req, res) => {
  const { name, image, description } = req.body;
  const categoryExists = await Category.findOne({ name });
  if (categoryExists) {
    res.status(400);
    throw new Error("Category already exists");
  }
  const category = new Category({ name, image, description });
  const createdCategory = await category.save();
  res.status(201).json(createdCategory);
});

// @desc    Update a category (admin)
// @route   PUT /api/categories/:id
export const updateCategory = asyncHandler(async (req, res) => {
  const { name, image, description } = req.body;
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  if (name !== undefined && name !== category.name) {
    const nameTaken = await Category.findOne({
      name,
      _id: { $ne: category._id },
    });
    if (nameTaken) {
      res.status(400);
      throw new Error("Category name already in use");
    }
    category.name = name;
  }
  if (description !== undefined) {
    category.description = description;
  }
  if (image !== undefined) {
    category.image = image;
  }

  const updatedCategory = await category.save();
  res.json(updatedCategory);
});

// @desc    Delete a category (admin)
// @route   DELETE /api/categories/:id
export const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (category) {
    await Category.deleteOne({ _id: category._id });
    res.json({ message: "Category removed" });
  } else {
    res.status(404);
    throw new Error("Category not found");
  }
});
