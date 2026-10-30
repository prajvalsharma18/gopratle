import type { ProfessionalCategory } from "@/components/requirements/types";
import { getApiBaseUrl } from "@/lib/api-base-url";

interface RequirementEventPayload {
  name: string;
  type: string;
  startDate: string;
  endDate?: string;
  location: string;
  venue?: string;
}

interface RequirementPreferencesPayload {
  budgetFlexibility?: "Fixed" | "Flexible" | "Open to Discussion";
  style?: string;
  additionalRequirements?: string;
}

type CategoryDetailsPayload =
  | { budget?: number; expectedAttendees?: number; services?: string[] }
  | { performanceType: string; duration?: number; audienceSize?: number }
  | { role: string; people: number; workingHours?: number };

export type CreateRequirementPayload = {
  event: RequirementEventPayload;
  preferences: RequirementPreferencesPayload;
} & (
  | { category: "planner"; categoryDetails: Extract<CategoryDetailsPayload, { services?: string[] }> }
  | { category: "performer"; categoryDetails: Extract<CategoryDetailsPayload, { performanceType: string }> }
  | { category: "crew"; categoryDetails: Extract<CategoryDetailsPayload, { people: number }> }
);

export interface CreatedRequirement {
  id: string;
  category: ProfessionalCategory;
  status: "submitted";
  createdAt: string;
}

interface ApiErrorDetail {
  field?: unknown;
  message?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validationMessage(errors: unknown[]) {
  const details = errors.flatMap((entry) => {
    if (!isRecord(entry)) return [];
    const item = entry as ApiErrorDetail;
    if (typeof item.message !== "string") return [];
    const field = typeof item.field === "string" ? `${item.field}: ` : "";
    return [`${field}${item.message}`];
  });
  return details.length ? details.join(" ") : "Some requirement details need attention.";
}

export async function createRequirement(payload: CreateRequirementPayload): Promise<CreatedRequirement> {
  const apiBaseUrl = getApiBaseUrl();

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/requirements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    throw new Error("Could not reach the GoPratle API. Check that the backend is running, then try again.");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error("The API returned a response we could not read. Your details are still here so you can retry.");
  }

  if (!response.ok) {
    if (response.status >= 500) {
      throw new Error("The server could not save your requirement. Your details are still here so you can retry.");
    }
    if (isRecord(body) && Array.isArray(body.errors)) {
      throw new Error(validationMessage(body.errors));
    }
    if (isRecord(body) && typeof body.message === "string") throw new Error(body.message);
    throw new Error(`The request could not be completed (HTTP ${response.status}). Please review your details and try again.`);
  }

  if (!isRecord(body) || body.success !== true || !isRecord(body.data)) {
    throw new Error("The API did not confirm that your requirement was saved. Your details are still here so you can retry.");
  }

  const { id, category, status, createdAt } = body.data;
  if (typeof id !== "string" || typeof createdAt !== "string" || status !== "submitted" || !["planner", "performer", "crew"].includes(String(category))) {
    throw new Error("The API response was incomplete, so we could not confirm that your requirement was saved.");
  }

  return { id, category: category as ProfessionalCategory, status, createdAt };
}
