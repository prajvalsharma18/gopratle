import { z } from "zod";

const optionalText = (max) => z.preprocess(
  (value) => value === "" ? undefined : value,
  z.string().trim().max(max).optional(),
);

const isoDate = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date in YYYY-MM-DD format.")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }, "Enter a valid calendar date.");

const optionalIsoDate = z.preprocess(
  (value) => value === "" ? undefined : value,
  isoDate.optional(),
);

const eventSchema = z.object({
  name: z.string().trim().min(1, "Event name is required.").max(120),
  type: z.string().trim().min(1, "Event type is required.").max(80),
  startDate: isoDate,
  endDate: optionalIsoDate,
  location: z.string().trim().min(1, "Location is required.").max(150),
  venue: optionalText(150),
}).strict().superRefine((event, context) => {
  if (event.endDate && event.endDate < event.startDate) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "End date cannot be before the event date." });
  }
});

const plannerDetails = z.object({
  budget: z.number().finite().min(0).max(10000000000).optional(),
  expectedAttendees: z.number().int().min(1).max(10000000).optional(),
  services: z.array(z.enum(["Venue Coordination", "Catering", "Decoration", "Logistics", "Complete Event Planning"])).max(5).optional(),
}).strict();

const performerDetails = z.object({
  performanceType: z.enum(["Singer", "DJ", "Musician", "Dancer", "Band", "Other"]),
  duration: z.number().finite().gt(0).max(1440).optional(),
  audienceSize: z.number().int().min(1).max(10000000).optional(),
}).strict();

const crewDetails = z.object({
  role: z.enum(["Sound Technician", "Lighting Technician", "Stage Crew", "Camera Operator", "Other"]),
  people: z.number().int().min(1).max(100000),
  workingHours: z.number().finite().gt(0).max(720).optional(),
}).strict();

const preferencesSchema = z.object({
  budgetFlexibility: z.enum(["Fixed", "Flexible", "Open to Discussion"]).optional(),
  style: optionalText(120),
  additionalRequirements: optionalText(3000),
}).strict();

export const requirementPayloadSchema = z.discriminatedUnion("category", [
  z.object({ event: eventSchema, category: z.literal("planner"), categoryDetails: plannerDetails, preferences: preferencesSchema }).strict(),
  z.object({ event: eventSchema, category: z.literal("performer"), categoryDetails: performerDetails, preferences: preferencesSchema }).strict(),
  z.object({ event: eventSchema, category: z.literal("crew"), categoryDetails: crewDetails, preferences: preferencesSchema }).strict(),
]);

export function toValidationErrors(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join(".") || "body",
    message: issue.message,
  }));
}
