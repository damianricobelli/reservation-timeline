import { parseAsStringEnum } from "nuqs";

export const searchParams = {
  view: {
    value: "view",
    parse: parseAsStringEnum(["day", "3-day", "week"]),
  }
};