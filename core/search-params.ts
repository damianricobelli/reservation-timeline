import { type inferParserType, parseAsString, parseAsStringEnum } from "nuqs";
import { parseAsArrayOf } from "nuqs/server";
import { createSearchParams } from "./create-search-params";
import type { ReservationStatus, TimelineConfig } from "./types";

const ALL_STATUS_VALUES: ReservationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SEATED",
  "FINISHED",
  "NO_SHOW",
  "CANCELLED",
];

export const searchParams = createSearchParams(
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
);

export type QueryValue<K extends keyof typeof searchParams> = inferParserType<
  (typeof searchParams)[K]["parse"]
>;
