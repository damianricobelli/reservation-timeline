import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import type { Reservation, ReservationTimelineRecord } from "@/core/types";
import type { SelectionTable } from "../types";
import { getReservationEntityKey } from "../utils";
import { getMoveValidationReason, isWithinServiceHours } from "./validation";

function buildReservation({
  id,
  tableId,
  partySize,
  startTime,
  endTime,
}: {
  id: string;
  tableId: string;
  partySize: number;
  startTime: string;
  endTime: string;
}): Reservation {
  return {
    id,
    tableId,
    customer: {
      name: `Customer ${id}`,
      phone: `+54 9 11 5555-${id.padStart(4, "0")}`,
    },
    partySize,
    startTime,
    endTime,
    durationMinutes: dayjs(endTime).diff(dayjs(startTime), "minute"),
    status: "CONFIRMED",
    priority: "STANDARD",
    createdAt: "2025-10-14T10:00:00-03:00",
    updatedAt: "2025-10-14T10:00:00-03:00",
  };
}

function buildRecord({
  date,
  reservations,
  serviceHours,
}: {
  date: string;
  reservations: Reservation[];
  serviceHours: { start: string; end: string }[];
}): ReservationTimelineRecord {
  return {
    date,
    restaurant: {
      id: "R1",
      name: "Bistro Central",
      timezone: "America/Argentina/Buenos_Aires",
      serviceHours,
    },
    sectors: [{ id: "S1", name: "Main", color: "#000", sortOrder: 0 }],
    tables: [
      {
        id: "T1",
        sectorId: "S1",
        name: "Table 1",
        capacity: { min: 2, max: 4 },
        sortOrder: 0,
      },
    ],
    reservations,
  };
}

const baseTable: SelectionTable = {
  id: "T1",
  sectorId: "S1",
  name: "Table 1",
  capacity: { min: 2, max: 4 },
  sortOrder: 0,
};

describe("getMoveValidationReason", () => {
  it("returns overlap when candidate intersects an existing reservation", () => {
    const existing = buildReservation({
      id: "1",
      tableId: "T1",
      partySize: 2,
      startTime: "2025-10-15T20:00:00-03:00",
      endTime: "2025-10-15T21:30:00-03:00",
    });
    const candidate = buildReservation({
      id: "2",
      tableId: "T1",
      partySize: 2,
      startTime: "2025-10-15T21:00:00-03:00",
      endTime: "2025-10-15T22:00:00-03:00",
    });

    const reason = getMoveValidationReason({
      candidate,
      targetDateKey: "2025-10-15",
      targetTable: baseTable,
      targetRecord: buildRecord({
        date: "2025-10-15",
        reservations: [existing],
        serviceHours: [{ start: "12:00", end: "00:00" }],
      }),
      sourceReservationEntityKey: getReservationEntityKey(candidate),
    });

    expect(reason).toBe("overlap");
  });

  it("returns capacity_exceeded when party size is outside table capacity", () => {
    const candidate = buildReservation({
      id: "3",
      tableId: "T1",
      partySize: 6,
      startTime: "2025-10-15T20:00:00-03:00",
      endTime: "2025-10-15T21:00:00-03:00",
    });

    const reason = getMoveValidationReason({
      candidate,
      targetDateKey: "2025-10-15",
      targetTable: baseTable,
      targetRecord: buildRecord({
        date: "2025-10-15",
        reservations: [],
        serviceHours: [{ start: "12:00", end: "00:00" }],
      }),
      sourceReservationEntityKey: "source-key",
    });

    expect(reason).toBe("capacity_exceeded");
  });

  it("validates service windows that cross midnight", () => {
    const tz = "America/Argentina/Buenos_Aires";
    const valid = isWithinServiceHours(
      dayjs("2025-10-15T23:30:00-03:00"),
      dayjs("2025-10-16T01:00:00-03:00"),
      "2025-10-15",
      [{ start: "22:00", end: "02:00" }],
      tz,
    );

    const invalid = isWithinServiceHours(
      dayjs("2025-10-16T01:30:00-03:00"),
      dayjs("2025-10-16T02:30:00-03:00"),
      "2025-10-15",
      [{ start: "22:00", end: "02:00" }],
      tz,
    );

    expect(valid).toBe(true);
    expect(invalid).toBe(false);
  });
});
