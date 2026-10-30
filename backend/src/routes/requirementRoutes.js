import { Router } from "express";
import mongoose from "mongoose";
import { createRequirementController } from "../controllers/requirementController.js";
import { createRequirementSearchController } from "../controllers/requirementSearchController.js";

export function createRequirementRoutes(options = {}) {
  const router = Router();
  router.get("/health", (_req, res) => {
    const connected = options.databaseReady ? options.databaseReady() : mongoose.connection.readyState === 1;
    res.status(connected ? 200 : 503).json({
      status: connected ? "ok" : "unavailable",
      api: "ok",
      database: { connected },
    });
  });
  router.post("/requirements", options.submissionRateLimit || ((_req, _res, next) => next()), createRequirementController(options));
  router.get("/requirements/search", options.searchRateLimit || ((_req, _res, next) => next()), createRequirementSearchController(options));
  return router;
}
