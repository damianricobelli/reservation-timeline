import { createUseTypedQueryState } from "@/core/create-use-typed-query-state";
import { searchParams } from "@/core/search-params";

export const useTimelineQueryState = createUseTypedQueryState(searchParams);
