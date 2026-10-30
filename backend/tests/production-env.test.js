import assert from "node:assert/strict";
import test from "node:test";
import { assertProductionConfiguration } from "../src/config/productionEnv.js";

test("requires database and HTTPS frontend configuration in production", () => {
  assert.throws(
    () => assertProductionConfiguration({ NODE_ENV: "production", FRONTEND_ORIGIN: "https://gopratle.example" }),
    /MONGODB_URI/,
  );
  assert.throws(
    () => assertProductionConfiguration({ NODE_ENV: "production", MONGODB_URI: "mongodb://localhost:27017/gopratle", FRONTEND_ORIGIN: "http://gopratle.example" }),
    /HTTPS origin/,
  );
  assert.doesNotThrow(() => assertProductionConfiguration({
    NODE_ENV: "production",
    MONGODB_URI: "mongodb+srv://localhost/gopratle",
    FRONTEND_ORIGIN: "https://gopratle.example,https://preview.gopratle.example",
  }));
  assert.doesNotThrow(() => assertProductionConfiguration({ NODE_ENV: "development" }));
});
