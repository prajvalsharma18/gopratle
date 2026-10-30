import "./config/env.js";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { connectDatabase, isDatabaseReady } from "./config/database.js";
import { assertProductionConfiguration } from "./config/productionEnv.js";
import { safeErrorSummary } from "./config/safeErrorSummary.js";

const port = Number(process.env.PORT) || 4000;
assertProductionConfiguration();
const app = createApp({ databaseReady: isDatabaseReady });
const server = app.listen(port, () => {
  console.log(`GoPratle API listening on port ${port}.`);
});

let retryTimer;
let retrying = false;

async function attemptDatabaseConnection() {
  if (retrying || isDatabaseReady()) return;
  retrying = true;
  try {
    await connectDatabase();
    console.log(`MongoDB connection ready (database: ${mongoose.connection.name}).`);
    if (retryTimer) clearInterval(retryTimer);
  } catch (error) {
    console.error("MongoDB connection unavailable; database-dependent requests cannot be served.", safeErrorSummary(error));
  } finally {
    retrying = false;
  }
}

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected; database-dependent requests are unavailable.");
  if (!retryTimer) retryTimer = setInterval(attemptDatabaseConnection, 10000).unref();
});

await attemptDatabaseConnection();
if (!isDatabaseReady() && process.env.MONGODB_URI && !retryTimer) retryTimer = setInterval(attemptDatabaseConnection, 10000).unref();

function shutdown(signal) {
  console.log(`${signal} received; shutting down API.`);
  if (retryTimer) clearInterval(retryTimer);
  server.close(async () => {
    await mongoose.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
