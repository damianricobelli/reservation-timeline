import dayjs from "dayjs";
import {
  type inferParserType,
  parseAsNumberLiteral,
  parseAsString,
  parseAsStringEnum,
} from "nuqs";
import { parseAsArrayOf } from "nuqs/server";
import { DEFAULT_ZOOM_PERCENT, ZOOM_STEPS } from "./constants";
import { createTypedSearchParams } from "./create-typed-search-params";
import type { ReservationStatus, TimelineConfig } from "./types";

const ALL_STATUS_VALUES: ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SEATED",
  "FINISHED",
  "NO_SHOW",
  "CANCELLED",
];

export const searchParams = createTypedSearchParams(
  {
    key: "view",
    parse: parseAsStringEnum<TimelineConfig["viewMode"]>([
      "day",
      "3-day",
      "week",
    ]).withDefault("day"),
  },
  {
    key: "search",
    parse: parseAsString.withDefault(""),
  },
  {
    key: "date",
    parse: parseAsString.withDefault(dayjs().format("YYYY-MM-DD")),
  },
  {
    key: "status",
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
  {
    key: "sectors",
    parse: parseAsArrayOf(parseAsString).withDefault([]),
  },
  {
    key: "tables",
    parse: parseAsArrayOf(parseAsString).withDefault([]),
  },
  {
    key: "zoom",
    parse: parseAsNumberLiteral(ZOOM_STEPS).withDefault(DEFAULT_ZOOM_PERCENT),
  },
);

export type QueryValue<K extends keyof typeof searchParams> = inferParserType<
  (typeof searchParams)[K]["parse"]
>;
