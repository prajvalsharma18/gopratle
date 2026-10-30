export function assertProductionConfiguration(env = process.env) {
  if (env.NODE_ENV !== "production") return;

  const missing = ["MONGODB_URI", "FRONTEND_ORIGIN"].filter((key) => !env[key]?.trim());
  if (missing.length) {
    throw new Error(`Missing required production configuration: ${missing.join(", ")}.`);
  }

  try {
    const databaseUrl = new URL(env.MONGODB_URI);
    if (!["mongodb:", "mongodb+srv:"].includes(databaseUrl.protocol) || !databaseUrl.hostname) {
      throw new Error();
    }
  } catch {
    throw new Error("MONGODB_URI must be a valid MongoDB connection URL.");
  }

  const origins = env.FRONTEND_ORIGIN.split(",").map((origin) => origin.trim());
  const invalidOrigin = origins.some((origin) => {
    try {
      const url = new URL(origin);
      return url.protocol !== "https:"
        || url.pathname !== "/"
        || Boolean(url.search || url.hash || url.username || url.password);
    } catch {
      return true;
    }
  });
  if (invalidOrigin) {
    throw new Error("FRONTEND_ORIGIN must contain HTTPS origin URLs without paths in production.");
  }
}
