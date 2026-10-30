import assert from "node:assert/strict";
import test from "node:test";
import { resolveDatabaseName } from "../src/config/database.js";

test("chooses an explicit database name, URI path, or application default in that order", () => {
  assert.equal(resolveDatabaseName("mongodb+srv://cluster.example", "events-db"), "events-db");
  assert.equal(resolveDatabaseName("mongodb+srv://cluster.example/events-db?retryWrites=true"), "events-db");
  assert.equal(resolveDatabaseName("mongodb+srv://cluster.example"), "gopratle");
  assert.equal(resolveDatabaseName("mongodb://cluster.example/?authSource=admin"), "gopratle");
});
