import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import { isWithinServiceHours } from "@/core/service-hours";
import { createSeedData } from "./create-seed-data";

describe("createSeedData", () => {
  it("keeps all generated reservations within the restaurant service hours", () => {
    const generatedRecords = Array.from({ length: 20 }, () =>
      createSeedData(5),
    ).flat();

    for (const record of generatedRecords) {
      for (const reservation of record.reservations) {
        const isValid = isWithinServiceHours(
          dayjs(reservation.startTime),
          dayjs(reservation.endTime),
          record.date,
          record.restaurant.serviceHours,
          record.restaurant.timezone,
        );

        expect(isValid).toBe(true);
      }
    }
  });
});
