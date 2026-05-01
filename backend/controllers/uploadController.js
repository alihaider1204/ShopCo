import asyncHandler from "express-async-handler";
import cloudinary from "cloudinary";

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (filePath) =>
  new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(filePath, { folder: "shopco/products" }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });

// @desc    Upload product image to Cloudinary
// @route   POST /api/upload
export const uploadImage = asyncHandler(async (req, res) => {
  const configured = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
  if (!configured) {
    res.status(503);
    throw new Error(
      "Image upload is not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to the server .env, or paste an image URL instead."
    );
  }

  const file = req.files?.image;
  if (!file?.tempFilePath) {
    res.status(400);
    throw new Error('No image file received. Send multipart field name "image".');
  }

  try {
    const result = await uploadToCloudinary(file.tempFilePath);
    res.json({ url: result.secure_url });
  } catch (err) {
    console.error("Cloudinary upload error:", err?.message || err);
    res.status(500);
    throw new Error("Cloudinary upload failed. Check credentials and file type.");
  }
});
