import { safeErrorSummary } from "../config/safeErrorSummary.js";

export function notFoundHandler(_req, res) {
  res.status(404).json({ success: false, message: "The requested endpoint was not found." });
}

export function errorHandler(error, _req, res, _next) {
  void _next;
  if (error?.type === "entity.parse.failed") {
    return res.status(400).json({ success: false, message: "Request body must be valid JSON containing an object." });
  }
  if (error?.message === "Not allowed by CORS") {
    return res.status(403).json({ success: false, message: "This origin is not allowed to access the API." });
  }
  if (error?.type === "entity.too.large") {
    return res.status(413).json({ success: false, message: "Request body is too large." });
  }
  if (error?.name === "ValidationError" || error?.name === "CastError") {
    return res.status(400).json({ success: false, message: "The requirement could not be saved because some details were invalid." });
  }

  console.error("Unhandled API error:", safeErrorSummary(error));
  return res.status(500).json({ success: false, message: "Something went wrong while processing the request." });
}
