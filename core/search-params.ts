import dayjs from "dayjs";
import { parseAsNumberLiteral, parseAsString, parseAsStringEnum } from "nuqs";
import { parseAsArrayOf } from "nuqs/server";
import { DEFAULT_ZOOM_PERCENT, ZOOM_STEPS } from "./constants";
import {
  createTypedQueryState,
  type QueryValue as QueryValueFromParams,
} from "./create-typed-query-state";
import type { ReservationStatus, TimelineConfig } from "./types";

const ALL_STATUS_VALUES: ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SEATED",
  "FINISHED",
  "NO_SHOW",
  "CANCELLED",
];

export const timelineQueryState = createTypedQueryState({
  view: {
    parse: parseAsStringEnum<TimelineConfig["viewMode"]>([
      "day",
      "3-day",
      "week",
    ]).withDefault("day"),
  },
  search: {
    parse: parseAsString.withDefault(""),
  },
  date: {
    parse: parseAsString.withDefault(dayjs().format("YYYY-MM-DD")),
  },
  status: {
    parse: parseAsArrayOf(
      parseAsStringEnum<ReservationStatus>([
        "PENDING",
        "CONFIRMED",
        "SEATED",
        "FINISHED",
        "NO_SHOW",
        "CANCELLED",
      ]),
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
