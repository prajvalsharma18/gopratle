import { z } from "zod";
import { isDatabaseReady } from "../config/database.js";
import { Requirement } from "../models/Requirement.js";

const searchQuerySchema = z.object({
  q: z.string().trim().min(2, "Enter at least 2 characters to search.").max(100, "Search is limited to 100 characters.").optional(),
  category: z.enum(["planner", "performer", "crew"]).optional(),
}).strict();

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function createRequirementSearchController({ RequirementModel = Requirement, databaseReady = isDatabaseReady } = {}) {
  return async function searchRequirements(req, res, next) {
    const parsed = searchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Search terms must contain 2 to 100 characters and category must be planner, performer, or crew.",
      });
    }
    if (!databaseReady()) {
      return res.status(503).json({ success: false, message: "Saved requirements are temporarily unavailable." });
    }

    try {
      const filter = {};
      if (parsed.data.category) filter.category = parsed.data.category;
      if (parsed.data.q) {
        const term = new RegExp(escapeRegex(parsed.data.q), "i");
        filter.$or = [
          { "event.name": term },
          { "event.type": term },
          { "event.location": term },
          { "event.venue": term },
          { category: term },
          { "categoryDetails.performanceType": term },
          { "categoryDetails.role": term },
          { "categoryDetails.services": term },
          { "preferences.style": term },
          { "preferences.additionalRequirements": term },
        ];
      }
      const documents = await RequirementModel.find(filter)
        .select("event category categoryDetails preferences status createdAt")
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();

      return res.json({
        success: true,
        data: documents.map((document) => ({
          id: String(document._id),
          event: document.event,
          category: document.category,
          categoryDetails: document.categoryDetails,
          preferences: document.preferences,
          status: document.status,
          createdAt: document.createdAt,
        })),
      });
    } catch (error) {
      return next(error);
    }
  };
}
