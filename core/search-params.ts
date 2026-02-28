import { parseAsString, parseAsStringEnum } from "nuqs";
import { ReservationStatus, TimelineConfig } from "./types";
import { parseAsArrayOf } from "nuqs/server";

export const searchParams = {
  view: {
    value: "view",
    parse: parseAsStringEnum<TimelineConfig["viewMode"]>([
      "day",
      "3-day",
      "week",
    ]),
  },
  searchInput: {
    value: "search",
    parse: parseAsString,
  },
  status: {
    value: "status",
    parse: parseAsArrayOf(
      parseAsStringEnum<ReservationStatus>([
        "PENDING",
        "CONFIRMED",
        "SEATED",
        "FINISHED",
        "NO_SHOW",
        "CANCELLED",
      ]),
    ),
  },
};
