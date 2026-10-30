import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";
import { createApp } from "../src/app.js";
import { Requirement } from "../src/models/Requirement.js";
import { requirementPayloadSchema } from "../src/validators/requirementValidator.js";

const base = {
  event: {
    name: "GoPratle test event",
    type: "Corporate Event",
    startDate: "2027-05-01",
    endDate: "2027-05-02",
    location: "Bengaluru",
  },
  preferences: { budgetFlexibility: "Flexible", style: "Modern" },
};

const plannerPayload = {
  ...base,
  category: "planner",
  categoryDetails: { budget: 12000, expectedAttendees: 80, services: ["Catering", "Decoration"] },
};

const performerPayload = {
  ...base,
  category: "performer",
  categoryDetails: { performanceType: "DJ", duration: 90, audienceSize: 350 },
};

const crewPayload = {
  ...base,
  category: "crew",
  categoryDetails: { role: "Sound Technician", people: 2, workingHours: 6 },
};

test("accepts valid planner, performer, and crew payloads", () => {
  for (const payload of [plannerPayload, performerPayload, crewPayload]) {
    assert.equal(requirementPayloadSchema.safeParse(payload).success, true);
  }
});

test("Mongoose model defaults status and does not add unrelated category fields", async () => {
  const documents = [
    new Requirement({ ...plannerPayload, event: { ...plannerPayload.event, startDate: new Date("2027-05-01T00:00:00Z"), endDate: new Date("2027-05-02T00:00:00Z") } }),
    new Requirement({ ...performerPayload, event: { ...performerPayload.event, startDate: new Date("2027-05-01T00:00:00Z"), endDate: new Date("2027-05-02T00:00:00Z") } }),
    new Requirement({ ...crewPayload, event: { ...crewPayload.event, startDate: new Date("2027-05-01T00:00:00Z"), endDate: new Date("2027-05-02T00:00:00Z") } }),
  ];
  for (const document of documents) {
    await document.validate();
    assert.equal(document.status, "submitted");
  }
  assert.equal(documents[1].categoryDetails.services, undefined);
  assert.equal(documents[2].categoryDetails.services, undefined);
  assert.equal(documents[0].categoryDetails.performanceType, undefined);
  assert.equal(documents[0].categoryDetails.role, undefined);
  assert.equal(Requirement.schema.options.timestamps, true);
});

test("rejects unsupported category and category-specific field mixing", () => {
  const unsupported = requirementPayloadSchema.safeParse({ ...plannerPayload, category: "photographer" });
  const mixed = requirementPayloadSchema.safeParse({
    ...plannerPayload,
    categoryDetails: { ...plannerPayload.categoryDetails, role: "Stage Crew" },
  });
  assert.equal(unsupported.success, false);
  assert.equal(mixed.success, false);
});

test("rejects missing required fields and whitespace-only event text", () => {
  const missing = requirementPayloadSchema.safeParse({
    ...plannerPayload,
    event: { type: "Corporate Event", startDate: "2027-05-01" },
  });
  const whitespace = requirementPayloadSchema.safeParse({ ...plannerPayload, event: { ...base.event, name: " " } });
  assert.equal(missing.success, false);
  assert.equal(whitespace.success, false);
});

test("rejects invalid calendar dates and end dates before start dates", () => {
  const invalidCalendarDate = requirementPayloadSchema.safeParse({
    ...plannerPayload,
    event: { ...base.event, startDate: "2027-02-30" },
  });
  const invalidRange = requirementPayloadSchema.safeParse({
    ...plannerPayload,
    event: { ...base.event, startDate: "2027-05-02", endDate: "2027-05-01" },
  });
  assert.equal(invalidCalendarDate.success, false);
  assert.equal(invalidRange.success, false);
});

test("rejects numeric strings, fractional attendee counts, and out-of-range numbers", () => {
  const stringBudget = requirementPayloadSchema.safeParse({
    ...plannerPayload,
    categoryDetails: { ...plannerPayload.categoryDetails, budget: "12000" },
  });
  const fractionalAttendees = requirementPayloadSchema.safeParse({
    ...plannerPayload,
    categoryDetails: { ...plannerPayload.categoryDetails, expectedAttendees: 8.5 },
  });
  const zeroCrew = requirementPayloadSchema.safeParse({
    ...crewPayload,
    categoryDetails: { ...crewPayload.categoryDetails, people: 0 },
  });
  assert.equal(stringBudget.success, false);
  assert.equal(fractionalAttendees.success, false);
  assert.equal(zeroCrew.success, false);
});

test("rejects missing performer and crew-specific required values", () => {
  const missingPerformance = requirementPayloadSchema.safeParse({ ...performerPayload, categoryDetails: {} });
  const missingCrewRole = requirementPayloadSchema.safeParse({ ...crewPayload, categoryDetails: { people: 2 } });
  const missingCrewCount = requirementPayloadSchema.safeParse({ ...crewPayload, categoryDetails: { role: "Stage Crew" } });
  assert.equal(missingPerformance.success, false);
  assert.equal(missingCrewRole.success, false);
  assert.equal(missingCrewCount.success, false);
});

test("rejects unexpected root and nested category structures", () => {
  const unexpectedRoot = requirementPayloadSchema.safeParse({ ...plannerPayload, wizardStep: 4 });
  const unexpectedNested = requirementPayloadSchema.safeParse({
    ...plannerPayload,
    categoryDetails: { ...plannerPayload.categoryDetails, role: "Camera Operator" },
  });
  assert.equal(unexpectedRoot.success, false);
  assert.equal(unexpectedNested.success, false);
});

test("returns 201 only after the requirement model save resolves", async () => {
  let stored;
  class StubRequirement {
    constructor(document) {
      Object.assign(this, document);
      this._id = "test-requirement-id";
      this.status = "submitted";
      this.createdAt = new Date("2027-01-01T00:00:00.000Z");
    }

    async save() {
      stored = { category: this.category, categoryDetails: this.categoryDetails, event: this.event };
      return this;
    }
  }

  const app = createApp({ RequirementModel: StubRequirement, databaseReady: () => true });
  const response = await request(app).post("/api/requirements").send(performerPayload);
  assert.equal(response.status, 201);
  assert.equal(response.body.data.id, "test-requirement-id");
  assert.equal(response.body.data.category, "performer");
  assert.equal(stored.categoryDetails.performanceType, "DJ");
  assert.equal(stored.event.startDate.toISOString(), "2027-05-01T00:00:00.000Z");
});

test("returns a safe server error when persistence fails", async () => {
  class FailedSaveRequirement {
    constructor(document) { Object.assign(this, document); }
    async save() { throw new Error("DATABASE_CONNECTION_ERROR_MARKER"); }
  }
  const app = createApp({ RequirementModel: FailedSaveRequirement, databaseReady: () => true });
  const response = await request(app).post("/api/requirements").send(plannerPayload);
  assert.equal(response.status, 500);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Something went wrong while processing the request.");
  assert.doesNotMatch(JSON.stringify(response.body), /DATABASE_CONNECTION_ERROR_MARKER/);
});

test("rejects malformed JSON with a safe 400 response", async () => {
  const app = createApp({ databaseReady: () => true });
  const response = await request(app)
    .post("/api/requirements")
    .set("Content-Type", "application/json")
    .send('{"event":');
  assert.equal(response.status, 400);
  assert.equal(response.body.message, "Request body must be valid JSON containing an object.");
});

test("rejects an invalid API payload with field-level errors", async () => {
  class NeverSaveRequirement {
    constructor() { throw new Error("Invalid request must not construct a model."); }
  }
  const app = createApp({ RequirementModel: NeverSaveRequirement, databaseReady: () => true });
  const response = await request(app).post("/api/requirements").send({
    ...plannerPayload,
    category: "planner",
    event: { ...base.event, endDate: "2027-04-30" },
  });
  assert.equal(response.status, 400);
  assert.equal(response.body.success, false);
  assert.ok(response.body.errors.some((error) => error.field === "event.endDate"));
});

test("reports database unavailable and does not attempt a save", async () => {
  class NeverSaveRequirement {
    constructor() { throw new Error("Should not construct a model while the database is unavailable."); }
  }
  const app = createApp({ RequirementModel: NeverSaveRequirement, databaseReady: () => false });
  const health = await request(app).get("/api/health");
  const create = await request(app).post("/api/requirements").send(plannerPayload);
  assert.equal(health.status, 503);
  assert.deepEqual(health.body.database, { connected: false });
  assert.equal(create.status, 503);
  assert.equal(create.body.success, false);
});

test("returns a clear 404 for unknown routes", async () => {
  const app = createApp({ databaseReady: () => false });
  const response = await request(app).get("/api/not-a-route");
  assert.equal(response.status, 404);
});

test("production CORS allows the configured frontend origin only", async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalFrontendOrigin = process.env.FRONTEND_ORIGIN;
  process.env.NODE_ENV = "production";
  process.env.FRONTEND_ORIGIN = "https://gopratle.example/";
  try {
    const app = createApp({ databaseReady: () => false });
    const allowed = await request(app).get("/api/health").set("Origin", "https://gopratle.example");
    const rejected = await request(app).get("/api/health").set("Origin", "https://other.example");
    assert.equal(allowed.headers["access-control-allow-origin"], "https://gopratle.example");
    assert.equal(rejected.status, 403);
    assert.equal(rejected.body.message, "This origin is not allowed to access the API.");
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalFrontendOrigin === undefined) delete process.env.FRONTEND_ORIGIN;
    else process.env.FRONTEND_ORIGIN = originalFrontendOrigin;
  }
});

test("sets standard security headers and rate limits requirement submissions", async () => {
  const app = createApp({ databaseReady: () => false });
  const health = await request(app).get("/api/health");
  assert.equal(health.headers["x-content-type-options"], "nosniff");
  assert.equal(health.headers["x-frame-options"], "SAMEORIGIN");
  assert.ok(health.headers["content-security-policy"]);

  let lastResponse;
  for (let attempt = 0; attempt < 11; attempt += 1) {
    lastResponse = await request(app).post("/api/requirements").send(plannerPayload);
  }
  assert.equal(lastResponse.status, 429);
  assert.equal(lastResponse.body.success, false);
  assert.ok(lastResponse.headers.ratelimit);
});

test("public requirement search filters by category and returns saved matches", async () => {
  const savedDocument = {
    _id: "saved-requirement-id",
    event: { name: "Test concert", type: "Concert", startDate: "2027-05-01T00:00:00.000Z", location: "Bengaluru" },
    category: "performer",
    categoryDetails: { performanceType: "DJ" },
    preferences: {},
    status: "submitted",
    createdAt: new Date("2027-01-01T00:00:00.000Z"),
  };
  let receivedFilter;
  let receivedLimit;
  const query = {
    select() { return this; },
    sort() { return this; },
    limit(value) { receivedLimit = value; return this; },
    async lean() { return [savedDocument]; },
  };
  class SearchRequirement {
    static find(filter) { receivedFilter = filter; return query; }
  }

  const app = createApp({ RequirementModel: SearchRequirement, databaseReady: () => true });
  const response = await request(app)
    .get("/api/requirements/search")
    .query({ q: "concert", category: "performer" });

  assert.equal(response.status, 200);
  assert.equal(response.body.data[0].id, "saved-requirement-id");
  assert.equal(response.body.data[0].category, "performer");
  assert.equal(receivedLimit, 100);
  assert.equal(receivedFilter.category, "performer");
  assert.ok(receivedFilter.$or[0]["event.name"] instanceof RegExp);

  const allCategories = await request(app).get("/api/requirements/search");
  assert.equal(allCategories.status, 200);
  assert.deepEqual(receivedFilter, {});
  assert.equal(allCategories.body.data.length, 1);
});
