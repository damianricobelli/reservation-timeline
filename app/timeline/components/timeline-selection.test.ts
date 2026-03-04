import { describe, expect, it } from "vitest";
import type {
  Reservation,
  ReservationTimelineRecord,
  Sector,
  Table,
} from "@/core/types";
import { getSeedSelectionForView } from "./timeline-selection";

const sectors: Sector[] = [
  { id: "S2", name: "Patio", color: "#0f0", sortOrder: 2 },
  { id: "S1", name: "Main", color: "#00f", sortOrder: 1 },
];

const tables: Table[] = [
  {
    id: "T2",
    sectorId: "S2",
    name: "P1",
    capacity: { min: 2, max: 4 },
    sortOrder: 2,
  },
  {
    id: "T1",
    sectorId: "S1",
    name: "M1",
    capacity: { min: 2, max: 6 },
    sortOrder: 1,
  },
];

function buildReservation({
  id,
  tableId,
  customerName,
  phone,
  startTime,
  endTime,
  status = "CONFIRMED",
}: {
  id: string;
  tableId: string;
  customerName: string;
  phone: string;
  startTime: string;
  endTime: string;
  status?: Reservation["status"];
}): Reservation {
  return {
    id,
    tableId,
    customer: {
      name: customerName,
      phone,
    },
    partySize: 2,
    startTime,
    endTime,
    durationMinutes: 90,
    status,
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
    sectors,
    tables,
    reservations,
  };
}

describe("getSeedSelectionForView", () => {
  it("builds sorted selection for day view", () => {
    const record = buildRecord("2025-10-15", [
      buildReservation({
        id: "R2",
        tableId: "T2",
        customerName: "Bruno",
        phone: "222",
        startTime: "2025-10-15T20:00:00-03:00",
        endTime: "2025-10-15T21:30:00-03:00",
      }),
      buildReservation({
        id: "R1",
        tableId: "T1",
        customerName: "Alice",
        phone: "111",
        startTime: "2025-10-15T19:00:00-03:00",
        endTime: "2025-10-15T20:30:00-03:00",
      }),
    ]);

    const selection = getSeedSelectionForView([record], "day", {
      baseDate: "2025-10-15",
      fallbackToSeedDate: true,
    });

    expect(selection.dateKeys).toEqual(["2025-10-15"]);
    expect(selection.sectors.map((sector) => sector.id)).toEqual(["S1", "S2"]);
    expect(selection.tables.map((table) => table.id)).toEqual(["T1", "T2"]);
    expect(selection.reservations.map((reservation) => reservation.id)).toEqual(
      ["R1", "R2"],
    );
  });

  it("applies combined sector/table/status/search filters", () => {
    const record = buildRecord("2025-10-15", [
      buildReservation({
        id: "R1",
        tableId: "T1",
        customerName: "Alice Walker",
        phone: "111",
        startTime: "2025-10-15T19:00:00-03:00",
        endTime: "2025-10-15T20:30:00-03:00",
        status: "CONFIRMED",
      }),
      buildReservation({
        id: "R2",
        tableId: "T1",
        customerName: "Bob Smith",
        phone: "222",
        startTime: "2025-10-15T21:00:00-03:00",
        endTime: "2025-10-15T22:00:00-03:00",
        status: "CANCELLED",
      }),
      buildReservation({
        id: "R3",
        tableId: "T2",
        customerName: "Carla Green",
        phone: "333",
        startTime: "2025-10-15T20:00:00-03:00",
        endTime: "2025-10-15T21:00:00-03:00",
        status: "CONFIRMED",
      }),
    ]);

    const selection = getSeedSelectionForView([record], "day", {
      baseDate: "2025-10-15",
      fallbackToSeedDate: true,
      sectorIds: ["S1", "UNKNOWN"],
      tableIds: ["T1"],
      statuses: ["CONFIRMED"],
      search: "alice",
    });

    expect(selection.sectors.map((sector) => sector.id)).toEqual(["S1"]);
    expect(selection.tables.map((table) => table.id)).toEqual(["T1"]);
    expect(selection.reservations.map((reservation) => reservation.id)).toEqual(
      ["R1"],
    );
  });
});
