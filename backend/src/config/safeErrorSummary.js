export function safeErrorSummary(error) {
  const name = typeof error?.name === "string" ? error.name.slice(0, 80) : "Error";
  const message = typeof error?.message === "string"
    ? error.message
      .replace(/mongodb(?:\+srv)?:\/\/[^\s"'<>]+/gi, "[redacted MongoDB connection string]")
      .slice(0, 500)
    : "Unexpected error without a message.";
  const code = typeof error?.code === "number"
    ? error.code
    : typeof error?.code === "string" && /^[A-Z0-9_-]{1,80}$/i.test(error.code)
      ? error.code
      : undefined;

  return { name, ...(code !== undefined ? { code } : {}), message };
}
