import mongoose from "mongoose";

const DEFAULT_DATABASE_NAME = "gopratle";

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

export function resolveDatabaseName(uri, configuredName = process.env.MONGODB_DB_NAME) {
  if (configuredName?.trim()) return configuredName.trim();

  const schemeEnd = uri.indexOf("://");
  if (schemeEnd === -1) return DEFAULT_DATABASE_NAME;

  const pathStart = uri.indexOf("/", schemeEnd + 3);
  if (pathStart === -1) return DEFAULT_DATABASE_NAME;

  const encodedName = uri.slice(pathStart + 1).split(/[?#]/, 1)[0];
  if (!encodedName) return DEFAULT_DATABASE_NAME;

  try {
    return decodeURIComponent(encodedName);
  } catch {
    return DEFAULT_DATABASE_NAME;
  }
}

export async function connectDatabase(uri = process.env.MONGODB_URI) {
  if (!uri || uri === "your_mongodb_connection_string") {
    throw new Error("MONGODB_URI is not configured.");
  }

  await mongoose.connect(uri, {
    dbName: resolveDatabaseName(uri),
    serverSelectionTimeoutMS: 5000,
  });
  return mongoose.connection;
}
