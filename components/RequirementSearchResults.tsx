"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CATEGORY_LABELS, type ProfessionalCategory } from "@/components/requirements/types";
import { searchSavedRequirements, type SavedRequirement } from "@/lib/requirements-search-api";

const CATEGORIES: ProfessionalCategory[] = ["planner", "performer", "crew"];

function displayDate(value: string) {
  return value.slice(0, 10);
}

function displayValue(value: unknown) {
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return value == null ? "" : JSON.stringify(value);
}

function detailLabel(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase());
}

function RequirementCard({ requirement }: { requirement: SavedRequirement }) {
  const eventRows: Array<[string, string]> = [
    ["Event type", requirement.event.type],
    ["Category", CATEGORY_LABELS[requirement.category]],
    ["Start date", displayDate(requirement.event.startDate)],
    ...(requirement.event.endDate ? [["End date", displayDate(requirement.event.endDate)] as [string, string]] : []),
    ["Location", requirement.event.location],
    ...(requirement.event.venue ? [["Venue", requirement.event.venue] as [string, string]] : []),
    ["Status", requirement.status],
    ["Submitted", new Date(requirement.createdAt).toLocaleString()],
  ];
  const detailRows = Object.entries(requirement.categoryDetails)
    .map(([key, value]) => [detailLabel(key), displayValue(value)] as [string, string])
    .filter(([, value]) => value !== "");
  const preferenceRows = Object.entries(requirement.preferences)
    .map(([key, value]) => [detailLabel(key), displayValue(value)] as [string, string])
    .filter(([, value]) => value !== "");

  return (
    <article className="saved-requirement-card">
      <header className="saved-requirement-heading">
        <div><p className="eyebrow">{CATEGORY_LABELS[requirement.category]}</p><h2>{requirement.event.name}</h2></div>
        <span className="saved-requirement-id">ID {requirement.id}</span>
      </header>
      <dl className="saved-requirement-details">
        {eventRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        {detailRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        {preferenceRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
    </article>
  );
}

export function RequirementSearchResults() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | ProfessionalCategory>("all");
  const [results, setResults] = useState<SavedRequirement[]>([]);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQuery = params.get("q") || "";
    const requestedCategory = params.get("category");
    const initialCategory = CATEGORIES.find((value) => value === requestedCategory) || "all";
    setQuery(initialQuery);
    setCategory(initialCategory);
    setIsSearching(true);
    searchSavedRequirements(initialQuery, initialCategory)
      .then((savedRequirements) => {
        setResults(savedRequirements);
        setHasSearched(true);
      })
      .catch((searchError: unknown) => {
        setError(searchError instanceof Error ? searchError.message : "Could not load saved requirements.");
      })
      .finally(() => setIsSearching(false));
  }, []);

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (normalizedQuery.length === 1) {
      setError("Enter at least 2 characters to search.");
      return;
    }

    setIsSearching(true);
    setHasSearched(false);
    setError("");
    try {
      const savedRequirements = await searchSavedRequirements(normalizedQuery, category);
      setResults(savedRequirements);
      setHasSearched(true);
    } catch (searchError) {
      setResults([]);
      setError(searchError instanceof Error ? searchError.message : "Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <div className="saved-search-shell">
      <div className="saved-search-heading">
        <p className="eyebrow">SAVED REQUIREMENTS</p>
        <h1>Browse event requirements</h1>
        <p>View requirements saved under planner, performer, and crew. Search by event details or filter by category.</p>
      </div>

      <form className="saved-search-form" onSubmit={handleSearch}>
        <div className="wizard-fields-grid saved-search-fields">
          <div className="wizard-field">
            <label htmlFor="saved-requirement-query">Search term</label>
            <input id="saved-requirement-query" value={query} onChange={(event) => setQuery(event.target.value)} minLength={2} maxLength={100} placeholder="e.g. wedding, Bengaluru, or DJ" />
          </div>
          <div className="wizard-field">
            <label htmlFor="saved-requirement-category">Category</label>
            <select id="saved-requirement-category" value={category} onChange={(event) => setCategory(event.target.value as "all" | ProfessionalCategory)}>
              <option value="all">All categories</option>
              {CATEGORIES.map((value) => <option value={value} key={value}>{CATEGORY_LABELS[value]}</option>)}
            </select>
          </div>
        </div>
        <button className="button button-primary" type="submit" disabled={isSearching}>
          {isSearching ? "Loading…" : "Show requirements"}
        </button>
      </form>

      {error && <p className="wizard-submission-error" role="alert">{error}</p>}
      {hasSearched && results.length === 0 && <p className="saved-search-empty" role="status">No saved requirements matched{query.trim() ? ` “${query.trim()}”` : ""}.</p>}
      {hasSearched && results.length > 0 && <section className="saved-search-results" aria-live="polite" aria-label="Saved requirement results">
        <p className="saved-search-count">Showing {results.length} matching {results.length === 1 ? "requirement" : "requirements"} (up to 100 newest records)</p>
        {(category === "all" ? CATEGORIES : [category]).map((categoryValue) => {
          const categoryResults = results.filter((requirement) => requirement.category === categoryValue);
          return <section className="saved-category-results" key={categoryValue} aria-labelledby={`results-${categoryValue}`}>
            <h2 id={`results-${categoryValue}`}>{CATEGORY_LABELS[categoryValue]}</h2>
            {categoryResults.length
              ? categoryResults.map((requirement) => <RequirementCard key={requirement.id} requirement={requirement} />)
              : <p className="saved-search-empty">No {CATEGORY_LABELS[categoryValue].toLowerCase()} requirements found.</p>}
          </section>;
        })}
      </section>}
      <p className="wizard-footnote">Requirements are displayed by category. Search returns at most the 100 most recent matches.</p>
    </div>
  );
}
