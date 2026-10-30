"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";

export function RequirementSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      setMessage("Enter at least 2 characters to search saved requirements.");
      return;
    }
    router.push(`/requirements/search?q=${encodeURIComponent(normalizedQuery)}`);
  }

  return (
    <div>
      <form className="search-form" role="search" onSubmit={submitSearch}>
        <Search size={19} aria-hidden="true" />
        <label className="sr-only" htmlFor="requirement-search">Search saved requirements</label>
        <input
          id="requirement-search"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setMessage("");
          }}
          aria-describedby={message ? "requirement-search-message" : undefined}
          placeholder="Search saved requirements"
        />
        <button type="submit">Search <ArrowRight size={15} aria-hidden="true" /></button>
      </form>
      {message && <p className="event-search-message" id="requirement-search-message" role="alert">{message}</p>}
    </div>
  );
}
