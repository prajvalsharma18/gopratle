import "./config/env.js";
import cors from "cors";
import { rateLimit } from "express-rate-limit";
import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import { createRequirementRoutes } from "./routes/requirementRoutes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

function configuredOrigins() {
  const configured = (process.env.FRONTEND_ORIGIN || (process.env.NODE_ENV === "production" ? "" : "http://localhost:3000"))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const normalized = configured.map((origin) => {
    try {
      return new URL(origin).origin;
    } catch {
      return origin;
    }
  });
  if (process.env.NODE_ENV !== "production") {
    normalized.push("http://localhost:3000", "http://127.0.0.1:3000");
  }
  return new Set(normalized);
}

export function createApp(options = {}) {
  const app = express();
  const origins = configuredOrigins();
  const trustProxyHops = process.env.NODE_ENV === "production"
    ? Number(process.env.TRUST_PROXY_HOPS || 1)
    : 0;
  if (!Number.isInteger(trustProxyHops) || trustProxyHops < 0) {
    throw new Error("TRUST_PROXY_HOPS must be a non-negative integer.");
  }
  app.set("trust proxy", trustProxyHops);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || origins.has(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    maxAge: 600,
  }));
  app.use(express.json({ limit: "32kb", strict: true }));
  app.use("/api", createRequirementRoutes({
    RequirementModel: options.RequirementModel,
    databaseReady: options.databaseReady || (() => mongoose.connection.readyState === 1),
    submissionRateLimit: rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 10,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: {
        success: false,
        message: "Too many submissions. Please wait before trying again.",
      },
    }),
    searchRateLimit: rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 30,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      message: { success: false, message: "Too many searches. Please wait before trying again." },
    }),
  }));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
