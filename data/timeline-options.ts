import { isServer, queryOptions } from "@tanstack/react-query";
import { DEFAULT_TIMELINE_COUNT } from "@/core/constants";
import type { ReservationTimelineRecord } from "@/core/types";
import { createSeedData } from "./create-seed-data";

export const timelineOptions = queryOptions({
  queryKey: ["timeline", DEFAULT_TIMELINE_COUNT],
  queryFn: async (): Promise<ReservationTimelineRecord[]> => {
    if (isServer) {
      return createSeedData(DEFAULT_TIMELINE_COUNT);
    }

    const response = await fetch(
      `/api/timeline?count=${DEFAULT_TIMELINE_COUNT}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch timeline data");
    }

    return response.json();
  },
});
