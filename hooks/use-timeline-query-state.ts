import { searchParams } from "@/core/search-params";
import { createUseTypedQueryState } from "./use-query-state";

export const useTimelineQueryState = createUseTypedQueryState(searchParams);
