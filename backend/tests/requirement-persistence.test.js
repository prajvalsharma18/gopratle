import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import mongoose from "mongoose";
import request from "supertest";
import { createApp } from "../src/app.js";
import { Requirement } from "../src/models/Requirement.js";

const uri = process.env.MONGODB_TEST_URI;

test("persists a requirement in an explicitly named test database", { skip: !uri }, async () => {
  const databaseName = new URL(uri.replace(/^mongodb\+srv:/, "https:").replace(/^mongodb:/, "http:")).pathname.slice(1).split("?")[0];
  assert.match(databaseName, /(^|[-_])test($|[-_])/i, "MONGODB_TEST_URI must point to a database name containing 'test'.");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
  const savedIds = [];
  try {
    const app = createApp({ databaseReady: () => mongoose.connection.readyState === 1 });
    const runId = randomUUID();
    const payloads = [
      {
        event: { name: `  Planner Mongo integration ${runId}  `, type: "Corporate Event", startDate: "2027-05-01", endDate: "2027-05-02", location: " Bengaluru " },
        category: "planner",
        categoryDetails: { budget: 15000, expectedAttendees: 80, services: ["Catering", "Decoration"] },
        preferences: { budgetFlexibility: "Flexible", style: "Modern", additionalRequirements: "Access seating" },
        verify(saved) {
          assert.equal(saved.categoryDetails.budget, 15000);
          assert.equal(saved.categoryDetails.expectedAttendees, 80);
          assert.deepEqual(saved.categoryDetails.services, ["Catering", "Decoration"]);
        },
      },
      {
        event: { name: `Performer Mongo integration ${runId}`, type: "Concert", startDate: "2027-06-01", location: "Delhi" },
        category: "performer",
        categoryDetails: { performanceType: "DJ", duration: 90, audienceSize: 300 },
        preferences: { budgetFlexibility: "Open to Discussion", style: "Electronic" },
        verify(saved) {
          assert.equal(saved.categoryDetails.performanceType, "DJ");
          assert.equal(saved.categoryDetails.duration, 90);
          assert.equal(saved.categoryDetails.audienceSize, 300);
        },
      },
      {
        event: { name: `Crew Mongo integration ${runId}`, type: "College Festival", startDate: "2027-07-01", location: "Chennai" },
        category: "crew",
        categoryDetails: { role: "Stage Crew", people: 3, workingHours: 6 },
        preferences: { style: "Outdoor" },
        verify(saved) {
          assert.equal(saved.categoryDetails.role, "Stage Crew");
          assert.equal(saved.categoryDetails.people, 3);
          assert.equal(saved.categoryDetails.workingHours, 6);
        },
      },
    ];

    for (const payload of payloads) {
      const response = await request(app).post("/api/requirements").send(payload);
      assert.equal(response.status, 201, JSON.stringify(response.body));
      assert.equal(response.body.data.category, payload.category);
      assert.equal(response.body.data.status, "submitted");
      assert.ok(response.body.data.id);
      assert.ok(response.body.data.createdAt);
      savedIds.push(response.body.data.id);

      const saved = await Requirement.findById(response.body.data.id).lean();
      assert.ok(saved, "the API response ID should be present in MongoDB");
      assert.equal(saved.category, payload.category);
      assert.equal(saved.status, "submitted");
      assert.ok(saved.createdAt instanceof Date);
      assert.ok(saved.updatedAt instanceof Date);
      assert.equal(saved.event.startDate.toISOString(), `${payload.event.startDate}T00:00:00.000Z`);
      assert.equal(saved.event.name, payload.event.name.trim());
      assert.deepEqual(Object.keys(saved.categoryDetails).sort(), Object.keys(payload.categoryDetails).sort());
      assert.deepEqual(saved.preferences, payload.preferences);
      if (payload.event.endDate) {
        assert.equal(saved.event.endDate.toISOString(), `${payload.event.endDate}T00:00:00.000Z`);
      } else {
        assert.equal(saved.event.endDate, undefined);
      }
      payload.verify(saved);
      if (payload.category === "planner") {
        assert.equal(saved.event.location, "Bengaluru");
      }
    }
  } finally {
    if (savedIds.length) await Requirement.deleteMany({ _id: { $in: savedIds } });
    await mongoose.disconnect();
  }
});
