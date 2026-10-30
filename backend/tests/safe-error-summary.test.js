import assert from "node:assert/strict";
import test from "node:test";
import { safeErrorSummary } from "../src/config/safeErrorSummary.js";

test("keeps useful error diagnostics while redacting MongoDB connection strings", () => {
  const connectionString = ["mongodb+srv:", "//", "audit-user", ":", "audit-pass", "@cluster.example/db?retryWrites=true"].join("");
  const summary = safeErrorSummary(Object.assign(
    new Error(`Could not connect to ${connectionString}`),
    { code: "ECONNREFUSED" },
  ));
  assert.equal(summary.name, "Error");
  assert.equal(summary.code, "ECONNREFUSED");
  assert.match(summary.message, /redacted MongoDB connection string/);
  assert.doesNotMatch(JSON.stringify(summary), /audit-user|audit-pass|cluster\.example/);
});
