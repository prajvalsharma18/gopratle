import { isDatabaseReady } from "../config/database.js";
import { Requirement } from "../models/Requirement.js";
import { requirementPayloadSchema, toValidationErrors } from "../validators/requirementValidator.js";

export function createRequirementController({ RequirementModel = Requirement, databaseReady = isDatabaseReady } = {}) {
  return async function createRequirement(req, res, next) {
    const parsed = requirementPayloadSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        message: "Please check the requirement details and try again.",
        errors: toValidationErrors(parsed.error),
      });
    }

    if (!databaseReady()) {
      return res.status(503).json({ success: false, message: "Requirement submissions are temporarily unavailable. Please try again shortly." });
    }

    try {
      const payload = parsed.data;
      const requirement = new RequirementModel({
        event: {
          ...payload.event,
          startDate: new Date(`${payload.event.startDate}T00:00:00.000Z`),
          ...(payload.event.endDate ? { endDate: new Date(`${payload.event.endDate}T00:00:00.000Z`) } : {}),
        },
        category: payload.category,
        categoryDetails: payload.categoryDetails,
        preferences: payload.preferences,
      });
      const saved = await requirement.save();

      return res.status(201).json({
        success: true,
        message: "Requirement submitted successfully",
        data: {
          id: String(saved._id),
          category: saved.category,
          status: saved.status,
          createdAt: saved.createdAt,
        },
      });
    } catch (error) {
      return next(error);
    }
  };
}
