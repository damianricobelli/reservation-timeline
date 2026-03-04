"use client";

import { useTimelineQueryStates } from "./use-timeline-query-state";

const TIMELINE_FILTER_KEYS = [
  "view",
  "date",
  "search",
  "status",
  "sectors",
  "tables",
] as const;

/**
 * Single-source accessor for timeline filter/search query params.
 */
export function useTimelineFilters() {
  const [filters, setFilters] = useTimelineQueryStates(TIMELINE_FILTER_KEYS);

  return {
    filters,
    setFilters,
  };
}
