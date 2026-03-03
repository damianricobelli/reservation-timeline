import { describe, expect, it } from "vitest";
import type { Reservation, ReservationTimelineRecord } from "@/core/types";
import { getReservationEntityKey } from "../utils";
import {
  appendReservation,
  commitReservationMove,
  findReservationByEntityKey,
} from "./records";

function buildReservation({
  id,
  tableId,
  startTime,
  endTime,
}: {
  id: string;
  tableId: string;
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
    partySize: 2,
    startTime,
    endTime,
    durationMinutes: 90,
    status: "CONFIRMED",
    priority: "STANDARD",
    createdAt: "2025-10-14T10:00:00-03:00",
    updatedAt: "2025-10-14T10:00:00-03:00",
  };
}

function buildRecord(
  date: string,
  reservations: Reservation[],
): ReservationTimelineRecord {
  return {
    date,
    restaurant: {
      id: "R1",
      name: "Bistro Central",
      timezone: "America/Argentina/Buenos_Aires",
      serviceHours: [{ start: "12:00", end: "00:00" }],
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

describe("records helpers", () => {
  it("findReservationByEntityKey returns reservation when present", () => {
    const reservation = buildReservation({
      id: "1",
      tableId: "T1",
      startTime: "2025-10-15T20:00:00-03:00",
      endTime: "2025-10-15T21:30:00-03:00",
    });

    const records = [buildRecord("2025-10-15", [reservation])];
    const found = findReservationByEntityKey(
      records,
      getReservationEntityKey(reservation),
    );

    expect(found?.id).toBe(reservation.id);
  });

  it("commitReservationMove updates and reorders reservations in same day", () => {
    const source = buildReservation({
      id: "1",
      tableId: "T1",
      startTime: "2025-10-15T20:00:00-03:00",
      endTime: "2025-10-15T21:30:00-03:00",
    });
    const other = buildReservation({
      id: "2",
      tableId: "T1",
      startTime: "2025-10-15T22:00:00-03:00",
      endTime: "2025-10-15T23:00:00-03:00",
    });

    const records = [buildRecord("2025-10-15", [source, other])];
    const nextReservation = {
      ...source,
      startTime: "2025-10-15T21:30:00-03:00",
      endTime: "2025-10-15T23:00:00-03:00",
    };

    const next = commitReservationMove(
      records,
      getReservationEntityKey(source),
      nextReservation,
    );

    expect(next[0]?.reservations[0]?.id).toBe("1");
    expect(next[0]?.reservations[0]?.startTime).toBe(
      "2025-10-15T21:30:00-03:00",
    );
    expect(next[0]?.reservations[1]?.id).toBe("2");
  });

  it("commitReservationMove moves reservation across days", () => {
    const source = buildReservation({
      id: "1",
      tableId: "T1",
      startTime: "2025-10-15T20:00:00-03:00",
      endTime: "2025-10-15T21:30:00-03:00",
    });
    const dayOne = buildRecord("2025-10-15", [source]);
    const dayTwo = buildRecord("2025-10-16", []);

    const moved = {
      ...source,
      startTime: "2025-10-16T20:00:00-03:00",
      endTime: "2025-10-16T21:30:00-03:00",
    };

    const next = commitReservationMove(
      [dayOne, dayTwo],
      getReservationEntityKey(source),
      moved,
    );

    expect(next[0]?.reservations).toHaveLength(0);
    expect(next[1]?.reservations).toHaveLength(1);
    expect(next[1]?.reservations[0]?.startTime).toBe(
      "2025-10-16T20:00:00-03:00",
    );
  });

  it("appendReservation adds and sorts reservation on target day", () => {
    const existing = buildReservation({
      id: "1",
      tableId: "T1",
      startTime: "2025-10-15T21:00:00-03:00",
      endTime: "2025-10-15T22:00:00-03:00",
    });
    const inserted = buildReservation({
      id: "2",
      tableId: "T1",
      startTime: "2025-10-15T19:00:00-03:00",
      endTime: "2025-10-15T20:00:00-03:00",
    });

    const next = appendReservation(
      [buildRecord("2025-10-15", [existing])],
      "2025-10-15",
      inserted,
    );

    expect(next[0]?.reservations).toHaveLength(2);
    expect(next[0]?.reservations[0]?.id).toBe("2");
    expect(next[0]?.reservations[1]?.id).toBe("1");
  });
});
