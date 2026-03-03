import dayjs from "dayjs";
import { parseAsNumberLiteral, parseAsString, parseAsStringEnum } from "nuqs";
import { parseAsArrayOf } from "nuqs/server";
import { DEFAULT_ZOOM_PERCENT, ZOOM_STEPS } from "./constants";
import {
  createTypedQueryState,
  type QueryValue as QueryValueFromParams,
} from "./create-typed-query-state";
import {
  DATE_KEY_FORMAT,
  RESERVATION_STATUS_VALUES,
  type ReservationStatus,
  TIMELINE_VIEW_MODE_VALUES,
} from "./types";

const ALL_STATUS_VALUES: ReservationStatus[] = [...RESERVATION_STATUS_VALUES];

export const timelineQueryState = createTypedQueryState({
  view: {
    parse: parseAsStringEnum([...TIMELINE_VIEW_MODE_VALUES]).withDefault("day"),
  },
  search: {
    parse: parseAsString.withDefault(""),
  },
  date: {
    parse: parseAsString.withDefault(dayjs().format(DATE_KEY_FORMAT)),
  },
  status: {
    parse: parseAsArrayOf(
      parseAsStringEnum<ReservationStatus>([...RESERVATION_STATUS_VALUES]),
    ).withDefault(ALL_STATUS_VALUES),
  },
  sectors: {
    parse: parseAsArrayOf(parseAsString).withDefault([]),
  },
  tables: {
    parse: parseAsArrayOf(parseAsString).withDefault([]),
  },
  zoom: {
    parse: parseAsNumberLiteral(ZOOM_STEPS).withDefault(DEFAULT_ZOOM_PERCENT),
  },
});

export const searchParams = timelineQueryState.searchParams;
export type QueryValue = QueryValueFromParams<typeof searchParams>;
