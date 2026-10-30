import mongoose from "mongoose";

const { Schema } = mongoose;

const eventSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  type: { type: String, required: true, trim: true, maxlength: 80 },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  location: { type: String, required: true, trim: true, maxlength: 150 },
  venue: { type: String, trim: true, maxlength: 150 },
}, { _id: false, strict: "throw" });

const categoryDetailsSchema = new Schema({
  budget: { type: Number, min: 0, max: 10000000000 },
  expectedAttendees: { type: Number, min: 1, max: 10000000 },
  services: { type: [{ type: String, enum: ["Venue Coordination", "Catering", "Decoration", "Logistics", "Complete Event Planning"] }], default: undefined },
  performanceType: { type: String, enum: ["Singer", "DJ", "Musician", "Dancer", "Band", "Other"] },
  duration: { type: Number, min: 0.01, max: 1440 },
  audienceSize: { type: Number, min: 1, max: 10000000 },
  role: { type: String, enum: ["Sound Technician", "Lighting Technician", "Stage Crew", "Camera Operator", "Other"] },
  people: { type: Number, min: 1, max: 100000 },
  workingHours: { type: Number, min: 0.01, max: 720 },
}, { _id: false, strict: "throw" });

const preferencesSchema = new Schema({
  budgetFlexibility: { type: String, enum: ["Fixed", "Flexible", "Open to Discussion"] },
  style: { type: String, trim: true, maxlength: 120 },
  additionalRequirements: { type: String, trim: true, maxlength: 3000 },
}, { _id: false, strict: "throw" });

const requirementSchema = new Schema({
  event: { type: eventSchema, required: true },
  category: { type: String, required: true, enum: ["planner", "performer", "crew"] },
  categoryDetails: { type: categoryDetailsSchema, required: true },
  preferences: { type: preferencesSchema, default: () => ({}) },
  status: { type: String, enum: ["submitted"], default: "submitted", required: true },
}, {
  timestamps: true,
  versionKey: false,
  strict: "throw",
  bufferCommands: false,
});

export const Requirement = mongoose.models.Requirement || mongoose.model("Requirement", requirementSchema);
