export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const mongooseMessage = (err) => {
  if (err.name === "ValidationError") {
    const first = Object.values(err.errors || {})[0];
    return first?.message || "Validation failed";
  }
  if (err.name === "CastError") {
    return "Invalid id format";
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || "field";
    if (field === "email") return "An account with this email already exists";
    return "Duplicate value — this already exists";
  }
  return null;
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  const mongoMsg = mongooseMessage(err);
  if (mongoMsg) {
    message = mongoMsg;
    if (statusCode === 500) statusCode = 400;
  }

  res.status(statusCode);
  res.json({
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};
