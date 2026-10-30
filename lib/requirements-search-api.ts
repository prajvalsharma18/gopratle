import type { ProfessionalCategory } from "@/components/requirements/types";
import { getApiBaseUrl } from "@/lib/api-base-url";

export interface SavedRequirement {
  id: string;
  event: {
    name: string;
    type: string;
    startDate: string;
    endDate?: string;
    location: string;
    venue?: string;
  };
  category: ProfessionalCategory;
  categoryDetails: Record<string, unknown>;
  preferences: Record<string, unknown>;
  status: string;
  createdAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSavedRequirement(value: unknown): SavedRequirement | null {
  if (!isRecord(value) || !isRecord(value.event) || !isRecord(value.categoryDetails) || !isRecord(value.preferences)) return null;
  const { id, category, status, createdAt, event } = value;
  if (
    typeof id !== "string"
    || !["planner", "performer", "crew"].includes(String(category))
    || typeof status !== "string"
    || typeof createdAt !== "string"
    || typeof event.name !== "string"
    || typeof event.type !== "string"
    || typeof event.startDate !== "string"
    || typeof event.location !== "string"
  ) return null;

  return {
    id,
    category: category as ProfessionalCategory,
    status,
    createdAt,
    event: {
      name: event.name,
      type: event.type,
      startDate: event.startDate,
      ...(typeof event.endDate === "string" ? { endDate: event.endDate } : {}),
      location: event.location,
      ...(typeof event.venue === "string" ? { venue: event.venue } : {}),
    },
    categoryDetails: value.categoryDetails,
    preferences: value.preferences,
  };
}

export async function searchSavedRequirements(query: string, category: "all" | ProfessionalCategory): Promise<SavedRequirement[]> {
  const apiBaseUrl = getApiBaseUrl();
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (category !== "all") params.set("category", category);
  const search = params.size ? `?${params.toString()}` : "";

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/requirements/search${search}`, {
      cache: "no-store",
    });
  } catch {
    throw new Error("Could not reach the GoPratle API. Check that the backend is running, then try again.");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("The API returned a response we could not read.");
  }

  if (!response.ok) {
    if (isRecord(body) && typeof body.message === "string") throw new Error(body.message);
    throw new Error(`Search failed (HTTP ${response.status}).`);
  }
  if (!isRecord(body) || body.success !== true || !Array.isArray(body.data)) {
    throw new Error("The API returned an unexpected search response.");
  }

  const records: SavedRequirement[] = [];
  for (const entry of body.data) {
    const record = parseSavedRequirement(entry);
    if (!record) throw new Error("The API returned an incomplete saved requirement.");
    records.push(record);
  }
  return records;
}
