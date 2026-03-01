import { createUseTypedQueryState } from "@/core/create-use-typed-query-state";
import { searchParams } from "@/core/search-params";

const timelineQueryState = createUseTypedQueryState(searchParams);

export const useTimelineQueryState = timelineQueryState.useQueryState;
export const useTimelineQueryStates = timelineQueryState.useQueryStates;
