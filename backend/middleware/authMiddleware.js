import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * protect — Express 4 does not forward rejected promises / thrown errors from async middleware.
 * Always call next(err) explicitly so errorHandler receives it.
 */
export const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) {
    res.status(401);
    return next(new Error("Not authorized, no token"));
  }

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      res.status(401);
      return next(new Error("Not authorized, user not found"));
    }
    next();
  } catch {
    res.status(401);
    next(new Error("Not authorized, token failed"));
  }
};

export const admin = (req, res, next) => {
  if (req.user && (req.user.isAdmin || req.user.role === "admin")) {
    return next();
  }
  res.status(403);
  next(new Error("Not authorized as an admin"));
};
