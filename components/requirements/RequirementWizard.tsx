"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleCheck, ClipboardList } from "lucide-react";
import { createRequirement, type CreateRequirementPayload, type CreatedRequirement } from "@/lib/requirements-api";
import { EVENT_TYPES } from "@/lib/event-types";
import { WizardProgress } from "@/components/requirements/WizardProgress";
import {
  CATEGORY_LABELS,
  INITIAL_REQUIREMENT,
  type CrewDetails,
  type PlannerDetails,
  type PerformerDetails,
  type ProfessionalCategory,
  type RequirementData,
  type RequirementErrors,
} from "@/components/requirements/types";

const PLANNER_SERVICES = ["Venue Coordination", "Catering", "Decoration", "Logistics", "Complete Event Planning"];
const PERFORMANCE_TYPES = ["Singer", "DJ", "Musician", "Dancer", "Band", "Other"];
const CREW_ROLES = ["Sound Technician", "Lighting Technician", "Stage Crew", "Camera Operator", "Other"];
const CATEGORY_PREFERENCES: Record<ProfessionalCategory, {
  title: string;
  description: string;
  flexibilityLabel: string;
  styleLabel: string;
  stylePlaceholder: string;
  notesLabel: string;
  notesHint: string;
  notesPlaceholder: string;
}> = {
  planner: {
    title: "Planning preferences",
    description: "Share the budget and planning details that will help your event planner prepare.",
    flexibilityLabel: "Budget flexibility",
    styleLabel: "Preferred style or theme",
    stylePlaceholder: "e.g. relaxed garden party",
    notesLabel: "Planning notes",
    notesHint: "Mention logistics, services, or other details for the planner.",
    notesPlaceholder: "Share any other planning details (optional)",
  },
  performer: {
    title: "Performance preferences",
    description: "Describe the performance style and any technical details for your performer.",
    flexibilityLabel: "Fee flexibility",
    styleLabel: "Preferred music or performance style",
    stylePlaceholder: "e.g. acoustic pop or classic jazz",
    notesLabel: "Performance and technical notes",
    notesHint: "Mention stage, sound, equipment, or performance requirements.",
    notesPlaceholder: "Share any performance or technical details (optional)",
  },
  crew: {
    title: "Crew preferences",
    description: "Share rate and working details that will help the event crew plan their support.",
    flexibilityLabel: "Rate flexibility",
    styleLabel: "Work setup preferences",
    stylePlaceholder: "e.g. indoor venue with a flexible setup",
    notesLabel: "Working requirements",
    notesHint: "Mention setup, access, equipment, or other working conditions.",
    notesPlaceholder: "Share any other crew requirements (optional)",
  },
};

function Field({ label, htmlFor, required, error, hint, children }: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className={`wizard-field${error ? " has-error" : ""}`}>
      <label htmlFor={htmlFor}>{label}{required && <span className="required-mark"> *</span>}</label>
      {children}
      {hint && <p className="field-hint" id={`${htmlFor}-hint`}>{hint}</p>}
      {error && <p className="field-error" id={`${htmlFor}-error`} role="alert">{error}</p>}
    </div>
  );
}

function controlDescription(id: string, error?: string, hint?: string) {
  return [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(" ") || undefined;
}

function isPositiveInteger(value: string) {
  return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
}

function isPositiveNumber(value: string) {
  return value.trim() !== "" && Number.isFinite(Number(value)) && Number(value) > 0;
}

function formatDate(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(`${value}T12:00:00`));
}

function buildCreatePayload(data: RequirementData): CreateRequirementPayload {
  const event = {
    name: data.eventName.trim(),
    type: data.eventType,
    startDate: data.eventDate,
    ...(data.endDate ? { endDate: data.endDate } : {}),
    location: data.location.trim(),
    ...(data.venue.trim() ? { venue: data.venue.trim() } : {}),
  };
  const preferences = {
    ...(data.flexibility ? { budgetFlexibility: data.flexibility as "Fixed" | "Flexible" | "Open to Discussion" } : {}),
    ...(data.style.trim() ? { style: data.style.trim() } : {}),
    ...(data.additionalRequirements.trim() ? { additionalRequirements: data.additionalRequirements.trim() } : {}),
  };

  if (data.category === "planner") {
    return {
      event,
      category: "planner",
      categoryDetails: {
        ...(data.planner.budget.trim() ? { budget: Number(data.planner.budget) } : {}),
        ...(data.planner.attendees.trim() ? { expectedAttendees: Number(data.planner.attendees) } : {}),
        services: [...data.planner.services],
      },
      preferences,
    };
  }
  if (data.category === "performer") {
    return {
      event,
      category: "performer",
      categoryDetails: {
        performanceType: data.performer.performanceType,
        ...(data.performer.duration.trim() ? { duration: Number(data.performer.duration) } : {}),
        ...(data.performer.audienceSize.trim() ? { audienceSize: Number(data.performer.audienceSize) } : {}),
      },
      preferences,
    };
  }
  if (data.category === "crew") {
    return {
      event,
      category: "crew",
      categoryDetails: {
        role: data.crew.role,
        people: Number(data.crew.people),
        ...(data.crew.workingHours.trim() ? { workingHours: Number(data.crew.workingHours) } : {}),
      },
      preferences,
    };
  }
  throw new Error("Choose a professional category before submitting.");
}

function ReviewGroup({ title, rows, onEdit }: { title: string; rows: Array<[string, string]>; onEdit: () => void }) {
  if (!rows.length) return null;
  return (
    <section className="review-group">
      <div className="review-group-heading"><h3>{title}</h3><button type="button" className="review-edit" onClick={onEdit}>Edit</button></div>
      <dl>{rows.map(([label, value]) => <div className="review-row" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    </section>
  );
}

export function RequirementWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<RequirementData>(INITIAL_REQUIREMENT);
  const [errors, setErrors] = useState<RequirementErrors>({});
  const [submission, setSubmission] = useState<CreatedRequirement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const submitted = submission !== null;
  const submitLock = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [step, submitted]);

  useEffect(() => {
    const eventType = new URLSearchParams(window.location.search).get("eventType");
    const availableType = EVENT_TYPES.find((type) => type === eventType);
    if (availableType) setData((current) => ({ ...current, eventType: availableType }));
  }, []);

  function updateField<K extends keyof RequirementData>(key: K, value: RequirementData[K]) {
    setData((current) => ({ ...current, [key]: value }));
    setSubmissionError("");
    setErrors((current) => { const next = { ...current }; delete next[key]; return next; });
  }

  function updatePlanner<K extends keyof PlannerDetails>(key: K, value: PlannerDetails[K]) {
    setData((current) => ({ ...current, planner: { ...current.planner, [key]: value } }));
    setSubmissionError("");
    setErrors((current) => { const next = { ...current }; delete next[`planner.${key}`]; return next; });
  }

  function updatePerformer<K extends keyof PerformerDetails>(key: K, value: PerformerDetails[K]) {
    setData((current) => ({ ...current, performer: { ...current.performer, [key]: value } }));
    setSubmissionError("");
    setErrors((current) => { const next = { ...current }; delete next[`performer.${key}`]; return next; });
  }

  function updateCrew<K extends keyof CrewDetails>(key: K, value: CrewDetails[K]) {
    setData((current) => ({ ...current, crew: { ...current.crew, [key]: value } }));
    setSubmissionError("");
    setErrors((current) => { const next = { ...current }; delete next[`crew.${key}`]; return next; });
  }

  function changeCategory(category: ProfessionalCategory | "") {
    setSubmissionError("");
    setData((current) => ({
      ...current,
      category,
      planner: INITIAL_REQUIREMENT.planner,
      performer: INITIAL_REQUIREMENT.performer,
      crew: INITIAL_REQUIREMENT.crew,
    }));
    setErrors({});
  }

  function validateCurrentStep(): RequirementErrors {
    const next: RequirementErrors = {};
    if (step === 1) {
      if (!data.eventName.trim()) next.eventName = "Enter an event name.";
      if (!data.eventType) next.eventType = "Choose an event type.";
      if (!data.eventDate) next.eventDate = "Choose an event date.";
      if (data.endDate && data.eventDate && data.endDate < data.eventDate) next.endDate = "End date cannot be before the event date.";
      if (!data.location.trim()) next.location = "Enter a city or event location.";
      if (!data.category) next.category = "Choose a professional category.";
    }
    if (step === 2) {
      if (data.category === "planner") {
        if (data.planner.budget && (!Number.isFinite(Number(data.planner.budget)) || Number(data.planner.budget) < 0)) next["planner.budget"] = "Enter a valid budget of zero or more.";
        if (data.planner.attendees && !isPositiveInteger(data.planner.attendees)) next["planner.attendees"] = "Enter a positive whole number of attendees.";
      }
      if (data.category === "performer") {
        if (!data.performer.performanceType) next["performer.performanceType"] = "Choose a performance type.";
        if (data.performer.duration && !isPositiveNumber(data.performer.duration)) next["performer.duration"] = "Enter a number greater than zero.";
        if (data.performer.audienceSize && !isPositiveInteger(data.performer.audienceSize)) next["performer.audienceSize"] = "Enter a positive whole number of people.";
      }
      if (data.category === "crew") {
        if (!data.crew.role) next["crew.role"] = "Choose a crew role.";
        if (!isPositiveInteger(data.crew.people)) next["crew.people"] = "Enter a positive whole number of people.";
        if (data.crew.workingHours && !isPositiveNumber(data.crew.workingHours)) next["crew.workingHours"] = "Enter a number greater than zero.";
      }
    }
    return next;
  }

  function continueToNextStep() {
    const nextErrors = validateCurrentStep();
    setErrors(nextErrors);
    const firstError = Object.keys(nextErrors)[0];
    if (firstError) {
      document.getElementById(firstError)?.focus();
      return;
    }
    setStep((current) => Math.min(current + 1, 4));
  }

  function goBack() {
    setErrors({});
    setStep((current) => Math.max(current - 1, 1));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step !== 4 || submitted || isSubmitting || submitLock.current) return;
    submitLock.current = true;
    setIsSubmitting(true);
    setSubmissionError("");
    try {
      const created = await createRequirement(buildCreatePayload(data));
      setSubmission(created);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : "We could not submit your requirement. Please try again.");
      submitLock.current = false;
    } finally {
      setIsSubmitting(false);
    }
  }

  const plannerRows: Array<[string, string]> = [
    ...(data.planner.budget ? [["Event budget", data.planner.budget] as [string, string]] : []),
    ...(data.planner.attendees ? [["Expected attendees", data.planner.attendees] as [string, string]] : []),
    ...(data.planner.services.length ? [["Services required", data.planner.services.join(", ")] as [string, string]] : []),
  ];
  const performerRows: Array<[string, string]> = [
    ["Performance type", data.performer.performanceType],
    ...(data.performer.duration ? [["Performance duration", `${data.performer.duration} minutes`] as [string, string]] : []),
    ...(data.performer.audienceSize ? [["Expected audience", data.performer.audienceSize] as [string, string]] : []),
  ];
  const crewRows: Array<[string, string]> = [
    ["Crew role", data.crew.role],
    ["People required", data.crew.people],
    ...(data.crew.workingHours ? [["Working hours", data.crew.workingHours] as [string, string]] : []),
  ];

  const basicsRows: Array<[string, string]> = [
    ["Event name", data.eventName],
    ["Event type", data.eventType],
    ["Event date", formatDate(data.eventDate)],
    ["End date", data.endDate ? formatDate(data.endDate) : "Single-day event"],
    ["Location", data.location],
    ...(data.venue.trim() ? [["Venue", data.venue] as [string, string]] : []),
    ["Professional category", data.category ? CATEGORY_LABELS[data.category] : ""],
  ];
  const preferencesRows: Array<[string, string]> = [
    ...(data.flexibility ? [[data.category ? CATEGORY_PREFERENCES[data.category].flexibilityLabel : "Budget flexibility", data.flexibility] as [string, string]] : []),
    ...(data.style.trim() ? [[data.category ? CATEGORY_PREFERENCES[data.category].styleLabel : "Preferred style or theme", data.style] as [string, string]] : []),
    ...(data.additionalRequirements.trim() ? [[data.category ? CATEGORY_PREFERENCES[data.category].notesLabel : "Additional requirements", data.additionalRequirements] as [string, string]] : []),
  ];

  const currentHeading = [
    "Tell us about your event",
    "A few category details",
    "Your preferences",
    "Review your requirement",
  ][step - 1];

  return (
    <div className="wizard-shell">
      <div className="wizard-heading">
        <p className="eyebrow">Your event starts here</p>
        <h1 ref={headingRef} tabIndex={-1}>{submitted ? "Requirement submitted" : currentHeading}</h1>
        <p>{submitted ? "Your requirement was saved successfully." : "A few details help us find the right people for the occasion."}</p>
      </div>

      {!submitted && <WizardProgress currentStep={step} />}

      {submitted ? (
        <section className="wizard-completion" aria-live="polite">
          <span className="completion-icon"><CircleCheck size={28} aria-hidden="true" /></span>
          <p className="eyebrow">Submission confirmed</p>
          <h2>Your requirement was saved.</h2>
          <p>Keep this reference if you need to follow up on your submission.</p>
          <dl className="submission-confirmation">
            <div><dt>Requirement ID</dt><dd><code>{submission.id}</code></dd></div>
            <div><dt>Professional category</dt><dd>{CATEGORY_LABELS[submission.category]}</dd></div>
          </dl>
          <Link className="button button-primary" href="/">Back to GoPratle</Link>
        </section>
      ) : (
        <form className="wizard-form" noValidate onSubmit={handleSubmit} aria-busy={isSubmitting}>
          <div className="wizard-form-top"><span><ClipboardList size={15} aria-hidden="true" /> REQUIREMENT DETAILS</span><span>0{step} <i>/</i> 04</span></div>

          {step === 1 && (
            <section className="wizard-step" aria-labelledby="basics-title">
              <div className="wizard-step-intro"><h2 id="basics-title">Event basics</h2><p>Start with the essentials. You can add more details along the way.</p></div>
              <div className="wizard-fields-grid">
                <Field label="Event name" htmlFor="eventName" required error={errors.eventName}>
                  <input id="eventName" required autoComplete="off" value={data.eventName} onChange={(event) => updateField("eventName", event.target.value)} aria-invalid={!!errors.eventName} aria-describedby={controlDescription("eventName", errors.eventName)} placeholder="e.g. Summer team celebration" />
                </Field>
                <Field label="Event type" htmlFor="eventType" required error={errors.eventType}>
                  <select id="eventType" required value={data.eventType} onChange={(event) => updateField("eventType", event.target.value)} aria-invalid={!!errors.eventType} aria-describedby={controlDescription("eventType", errors.eventType)}>
                    <option value="">Choose an event type</option>{EVENT_TYPES.map((type) => <option key={type}>{type}</option>)}
                  </select>
                </Field>
                <Field label="Event date" htmlFor="eventDate" required error={errors.eventDate}>
                  <input id="eventDate" type="date" required value={data.eventDate} onChange={(event) => updateField("eventDate", event.target.value)} aria-invalid={!!errors.eventDate} aria-describedby={controlDescription("eventDate", errors.eventDate)} />
                </Field>
                <Field label="End date" htmlFor="endDate" error={errors.endDate} hint="Leave blank for a single-day event.">
                  <input id="endDate" type="date" min={data.eventDate || undefined} value={data.endDate} onChange={(event) => updateField("endDate", event.target.value)} aria-invalid={!!errors.endDate} aria-describedby={controlDescription("endDate", errors.endDate, "Leave blank for a single-day event.")} />
                </Field>
                <Field label="City or location" htmlFor="location" required error={errors.location}>
                  <input id="location" required autoComplete="address-level2" value={data.location} onChange={(event) => updateField("location", event.target.value)} aria-invalid={!!errors.location} aria-describedby={controlDescription("location", errors.location)} placeholder="e.g. Bengaluru" />
                </Field>
                <Field label="Venue" htmlFor="venue" hint="If you have one in mind.">
                  <input id="venue" value={data.venue} onChange={(event) => updateField("venue", event.target.value)} aria-describedby={controlDescription("venue", undefined, "If you have one in mind.")} placeholder="Venue name (optional)" />
                </Field>
                <Field label="Professional category" htmlFor="category" required error={errors.category}>
                  <select id="category" required value={data.category} onChange={(event) => changeCategory(event.target.value as ProfessionalCategory | "")} aria-invalid={!!errors.category} aria-describedby={controlDescription("category", errors.category)}>
                    <option value="">Choose who you’re looking for</option>
                    <option value="planner">Event Planner</option><option value="performer">Performer</option><option value="crew">Crew</option>
                  </select>
                </Field>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="wizard-step" aria-labelledby="category-details-title">
              <div className="wizard-step-intro"><h2 id="category-details-title">{data.category ? CATEGORY_LABELS[data.category] : "Category"} requirements</h2><p>Share the details that will help professionals understand what you need.</p></div>
              {!data.category && <p className="wizard-inline-error" role="alert">Choose a professional category in Event basics to continue.</p>}

              {data.category === "planner" && <div className="wizard-fields-grid">
                <Field label="Event budget" htmlFor="planner.budget" error={errors["planner.budget"]} hint="Optional. Enter an amount in your local currency.">
                  <input id="planner.budget" type="number" min="0" step="any" inputMode="decimal" value={data.planner.budget} onChange={(event) => updatePlanner("budget", event.target.value)} aria-invalid={!!errors["planner.budget"]} aria-describedby={controlDescription("planner.budget", errors["planner.budget"], "Optional. Enter an amount in your local currency.")} placeholder="e.g. 2500" />
                </Field>
                <Field label="Expected attendees" htmlFor="planner.attendees" error={errors["planner.attendees"]}>
                  <input id="planner.attendees" type="number" min="1" step="1" inputMode="numeric" value={data.planner.attendees} onChange={(event) => updatePlanner("attendees", event.target.value)} aria-invalid={!!errors["planner.attendees"]} aria-describedby={controlDescription("planner.attendees", errors["planner.attendees"])} placeholder="e.g. 120" />
                </Field>
                <fieldset className="service-fieldset"><legend>Services required <span className="optional-label">(optional)</span></legend><p className="field-hint">Select all that apply.</p><div className="service-options">{PLANNER_SERVICES.map((service) => <label className="service-option" key={service}><input type="checkbox" checked={data.planner.services.includes(service)} onChange={(event) => updatePlanner("services", event.target.checked ? [...data.planner.services, service] : data.planner.services.filter((item) => item !== service))} /><span>{service}</span></label>)}</div></fieldset>
              </div>}

              {data.category === "performer" && <div className="wizard-fields-grid">
                <Field label="Performance type" htmlFor="performer.performanceType" required error={errors["performer.performanceType"]}>
                  <select id="performer.performanceType" required value={data.performer.performanceType} onChange={(event) => updatePerformer("performanceType", event.target.value)} aria-invalid={!!errors["performer.performanceType"]} aria-describedby={controlDescription("performer.performanceType", errors["performer.performanceType"])}><option value="">Choose a performance type</option>{PERFORMANCE_TYPES.map((type) => <option key={type}>{type}</option>)}</select>
                </Field>
                <Field label="Performance duration (minutes)" htmlFor="performer.duration" error={errors["performer.duration"]}>
                  <input id="performer.duration" type="number" min="0.01" step="any" inputMode="decimal" value={data.performer.duration} onChange={(event) => updatePerformer("duration", event.target.value)} aria-invalid={!!errors["performer.duration"]} aria-describedby={controlDescription("performer.duration", errors["performer.duration"])} placeholder="e.g. 45" />
                </Field>
                <Field label="Expected audience size" htmlFor="performer.audienceSize" error={errors["performer.audienceSize"]}>
                  <input id="performer.audienceSize" type="number" min="1" step="1" inputMode="numeric" value={data.performer.audienceSize} onChange={(event) => updatePerformer("audienceSize", event.target.value)} aria-invalid={!!errors["performer.audienceSize"]} aria-describedby={controlDescription("performer.audienceSize", errors["performer.audienceSize"])} placeholder="e.g. 200" />
                </Field>
              </div>}

              {data.category === "crew" && <div className="wizard-fields-grid">
                <Field label="Crew role" htmlFor="crew.role" required error={errors["crew.role"]}>
                  <select id="crew.role" required value={data.crew.role} onChange={(event) => updateCrew("role", event.target.value)} aria-invalid={!!errors["crew.role"]} aria-describedby={controlDescription("crew.role", errors["crew.role"])}><option value="">Choose a crew role</option>{CREW_ROLES.map((role) => <option key={role}>{role}</option>)}</select>
                </Field>
                <Field label="Number of people required" htmlFor="crew.people" required error={errors["crew.people"]}>
                  <input id="crew.people" type="number" required min="1" step="1" inputMode="numeric" value={data.crew.people} onChange={(event) => updateCrew("people", event.target.value)} aria-invalid={!!errors["crew.people"]} aria-describedby={controlDescription("crew.people", errors["crew.people"])} placeholder="e.g. 4" />
                </Field>
                <Field label="Working hours" htmlFor="crew.workingHours" error={errors["crew.workingHours"]} hint="Optional. Estimate the total time needed.">
                  <input id="crew.workingHours" type="number" min="0.01" step="any" inputMode="decimal" value={data.crew.workingHours} onChange={(event) => updateCrew("workingHours", event.target.value)} aria-invalid={!!errors["crew.workingHours"]} aria-describedby={controlDescription("crew.workingHours", errors["crew.workingHours"], "Optional. Estimate the total time needed.")} placeholder="e.g. 6" />
                </Field>
              </div>}
            </section>
          )}

          {step === 3 && <section className="wizard-step" aria-labelledby="preferences-title">
            <div className="wizard-step-intro"><h2 id="preferences-title">{data.category ? CATEGORY_PREFERENCES[data.category].title : "A few finishing touches"}</h2><p>{data.category ? CATEGORY_PREFERENCES[data.category].description : "These preferences are optional and help set the right expectations."}</p></div>
            <div className="wizard-fields-grid">
              <Field label={data.category ? CATEGORY_PREFERENCES[data.category].flexibilityLabel : "Budget flexibility"} htmlFor="flexibility">
                <select id="flexibility" value={data.flexibility} onChange={(event) => updateField("flexibility", event.target.value)}><option value="">Choose an option (optional)</option><option>Fixed</option><option>Flexible</option><option>Open to Discussion</option></select>
              </Field>
              <Field label={data.category ? CATEGORY_PREFERENCES[data.category].styleLabel : "Preferred style or theme"} htmlFor="style">
                <input id="style" value={data.style} onChange={(event) => updateField("style", event.target.value)} placeholder={data.category ? CATEGORY_PREFERENCES[data.category].stylePlaceholder : "e.g. relaxed garden party"} />
              </Field>
              <Field label={data.category ? CATEGORY_PREFERENCES[data.category].notesLabel : "Additional requirements"} htmlFor="additionalRequirements" hint={data.category ? CATEGORY_PREFERENCES[data.category].notesHint : "Include anything else professionals should know."}>
                <textarea id="additionalRequirements" rows={5} value={data.additionalRequirements} onChange={(event) => updateField("additionalRequirements", event.target.value)} aria-describedby="additionalRequirements-hint" placeholder={data.category ? CATEGORY_PREFERENCES[data.category].notesPlaceholder : "Share any useful details (optional)"} />
              </Field>
            </div>
          </section>}

          {step === 4 && <section className="wizard-step" aria-labelledby="review-title">
            <div className="wizard-step-intro"><h2 id="review-title">A final look</h2><p>Check your details before submitting. You can edit any section.</p></div>
            <div className="review-groups">
              <ReviewGroup title="Event basics" rows={basicsRows} onEdit={() => { setStep(1); setErrors({}); }} />
              {data.category === "planner" && <ReviewGroup title="Planner requirements" rows={plannerRows} onEdit={() => { setStep(2); setErrors({}); }} />}
              {data.category === "performer" && <ReviewGroup title="Performer requirements" rows={performerRows} onEdit={() => { setStep(2); setErrors({}); }} />}
              {data.category === "crew" && <ReviewGroup title="Crew requirements" rows={crewRows} onEdit={() => { setStep(2); setErrors({}); }} />}
              <ReviewGroup title="Additional preferences" rows={preferencesRows} onEdit={() => { setStep(3); setErrors({}); }} />
            </div>
            <p className="review-notice"><Check size={15} aria-hidden="true" /> This is a review of your entries. They will not be saved or sent yet.</p>
          </section>}

          {step === 4 && submissionError && <div className="wizard-submission-error" role="alert"><strong>We couldn’t submit your requirement.</strong><p>{submissionError} Your answers are still here so you can retry.</p></div>}

          <div className="wizard-actions">
            {step > 1 ? <button className="button button-secondary" type="button" onClick={goBack}><ArrowLeft size={16} aria-hidden="true" /> Back</button> : <span />}
            {step < 4 ? <button className="button button-primary" type="button" onClick={continueToNextStep}>Continue <ArrowRight size={16} aria-hidden="true" /></button> : <button className="button button-primary" type="submit" disabled={isSubmitting || submitted}>{isSubmitting ? "Submitting…" : <><Check size={16} aria-hidden="true" /> Submit Requirement</>}</button>}
          </div>
        </form>
      )}
      <p className="wizard-footnote">{submitted ? "Your submission was saved by GoPratle." : "Your details stay in this browser page and are not sent anywhere until you submit."}</p>
    </div>
  );
}
