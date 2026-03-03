import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import type { Reservation, ReservationTimelineRecord } from "@/core/types";
import type { SelectionTable } from "../types";
import { getReservationEntityKey } from "../utils";
import {
  buildDragPreview,
  buildResizePreview,
  getCommitReservationFromPreview,
} from "./preview";
import type { ActiveResizeState } from "./types";

function buildReservation({
  id,
  startTime,
  endTime,
}: {
  id: string;
  startTime: string;
  endTime: string;
}): Reservation {
  return {
    id,
    tableId: "T1",
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

const tableById = new Map<string, SelectionTable>([
  [
    "T1",
    {
      id: "T1",
      sectorId: "S1",
      name: "Table 1",
      capacity: { min: 2, max: 4 },
      sortOrder: 0,
    },
  ],
]);

describe("preview builders", () => {
  it("snaps drag move preview to 15-minute slots", () => {
    const source = buildReservation({
      id: "1",
      startTime: "2025-10-15T20:00:00-03:00",
      endTime: "2025-10-15T21:30:00-03:00",
    });

    const preview = buildDragPreview({
      reservationEntityKey: getReservationEntityKey(source),
      sourceReservation: source,
      sourceOffsetMinutes: 540,
      target: { dateKey: "2025-10-15", tableId: "T1" },
      transformX: 90,
      records: [buildRecord("2025-10-15", [source])],
      tableById,
      zoomPercent: 100,
    });

    expect(preview).not.toBeNull();
    expect(preview?.reservation.startTime).toBe("2025-10-15T20:30:00-03:00");
  });

  it("clamps resize preview to min and max durations", () => {
    const source = buildReservation({
      id: "1",
      startTime: "2025-10-15T20:00:00-03:00",
      endTime: "2025-10-15T21:30:00-03:00",
    });
    const timelineStart = dayjs("2025-10-15T11:00:00-03:00");
    const timelineEnd = dayjs("2025-10-16T00:00:00-03:00");

    const baseState: Omit<ActiveResizeState, "edge"> = {
      reservationEntityKey: getReservationEntityKey(source),
      pointerId: 1,
      originClientX: 0,
      sourceReservation: source,
      targetDateKey: "2025-10-15",
      targetTable: tableById.get("T1") as SelectionTable,
      targetRecord: buildRecord("2025-10-15", [source]),
      timelineStart,
      timelineEnd,
      preview: {
        reservation: source,
        timelineStart,
        timelineEnd,
        valid: true,
      },
    };

    const startResizePreview = buildResizePreview({
      state: {
        ...baseState,
        edge: "start",
      },
      nextClientX: 2000,
      zoomPercent: 100,
    });

    const endResizePreview = buildResizePreview({
      state: {
        ...baseState,
        edge: "end",
      },
      nextClientX: 2000,
      zoomPercent: 100,
    });

    expect(startResizePreview.reservation.durationMinutes).toBe(30);
    expect(endResizePreview.reservation.durationMinutes).toBe(240);
  });

  it("returns null commit candidate for invalid resize preview", () => {
    const source = buildReservation({
      id: "1",
      startTime: "2025-10-15T20:00:00-03:00",
      endTime: "2025-10-15T21:00:00-03:00",
    });
    const conflict = buildReservation({
      id: "2",
      startTime: "2025-10-15T21:00:00-03:00",
      endTime: "2025-10-15T22:00:00-03:00",
    });
    const timelineStart = dayjs("2025-10-15T11:00:00-03:00");
    const timelineEnd = dayjs("2025-10-16T00:00:00-03:00");

    const preview = buildResizePreview({
      state: {
        reservationEntityKey: getReservationEntityKey(source),
        pointerId: 1,
        edge: "end",
        originClientX: 0,
        sourceReservation: source,
        targetDateKey: "2025-10-15",
        targetTable: tableById.get("T1") as SelectionTable,
        targetRecord: buildRecord("2025-10-15", [source, conflict]),
        timelineStart,
        timelineEnd,
        preview: {
          reservation: source,
          timelineStart,
          timelineEnd,
          valid: true,
        },
      },
      nextClientX: 60,
      zoomPercent: 100,
    });

    expect(preview.valid).toBe(false);
    expect(getCommitReservationFromPreview(preview)).toBeNull();
  });
});
