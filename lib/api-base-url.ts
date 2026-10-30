export function getApiBaseUrl() {
  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!configuredBaseUrl) {
    throw new Error("The API address is not configured. Set NEXT_PUBLIC_API_BASE_URL and restart the frontend.");
  }

  let apiUrl: URL;
  try {
    apiUrl = new URL(configuredBaseUrl);
  } catch {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must be an absolute HTTP or HTTPS URL.");
  }
  if (!["http:", "https:"].includes(apiUrl.protocol)) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must use HTTP or HTTPS.");
  }
  if (process.env.NODE_ENV === "production" && apiUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must use HTTPS in production.");
  }
  if (apiUrl.username || apiUrl.password || apiUrl.search || apiUrl.hash) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL must not include credentials, query parameters, or a fragment.");
  }

  const apiPath = apiUrl.pathname.replace(/\/+$/, "").replace(/\/api$/i, "");
  return `${apiUrl.origin}${apiPath}`;
}
