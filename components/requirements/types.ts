export type ProfessionalCategory = "planner" | "performer" | "crew";

export interface PlannerDetails {
  budget: string;
  attendees: string;
  services: string[];
}

export interface PerformerDetails {
  performanceType: string;
  duration: string;
  audienceSize: string;
}

export interface CrewDetails {
  role: string;
  people: string;
  workingHours: string;
}

export interface RequirementData {
  eventName: string;
  eventType: string;
  eventDate: string;
  endDate: string;
  location: string;
  venue: string;
  category: ProfessionalCategory | "";
  planner: PlannerDetails;
  performer: PerformerDetails;
  crew: CrewDetails;
  flexibility: string;
  style: string;
  additionalRequirements: string;
}

export type RequirementErrors = Partial<Record<string, string>>;

export const CATEGORY_LABELS: Record<ProfessionalCategory, string> = {
  planner: "Event Planner",
  performer: "Performer",
  crew: "Crew",
};

export const INITIAL_REQUIREMENT: RequirementData = {
  eventName: "",
  eventType: "",
  eventDate: "",
  endDate: "",
  location: "",
  venue: "",
  category: "",
  planner: { budget: "", attendees: "", services: [] },
  performer: { performanceType: "", duration: "", audienceSize: "" },
  crew: { role: "", people: "", workingHours: "" },
  flexibility: "",
  style: "",
  additionalRequirements: "",
};
