import express from "express";
import { uploadImage } from "../controllers/uploadController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import fileUpload from "express-fileupload";

const router = express.Router();

router.use(fileUpload({ useTempFiles: true }));

router.post("/", protect, admin, uploadImage);

export default router;
