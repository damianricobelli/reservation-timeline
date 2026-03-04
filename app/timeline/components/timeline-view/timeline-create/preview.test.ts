import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import type { Reservation, ReservationTimelineRecord } from "@/core/types";
import type { SelectionTable } from "../types";
import { buildCreatePreview } from "./preview";

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
    durationMinutes: dayjs(endTime).diff(dayjs(startTime), "minute"),
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

const table: SelectionTable = {
  id: "T1",
  sectorId: "S1",
  name: "Table 1",
  capacity: { min: 2, max: 4 },
  sortOrder: 0,
};

describe("buildCreatePreview", () => {
  it("builds a valid reservation creation preview with snapped duration", () => {
    const preview = buildCreatePreview({
      originClientX: 0,
      nextClientX: 120,
      sourceOffsetMinutes: 480,
      dateKey: "2025-10-15",
      table,
      targetRecord: buildRecord("2025-10-15", []),
      timelineStart: dayjs("2025-10-15T11:00:00-03:00"),
      timelineEnd: dayjs("2025-10-16T00:00:00-03:00"),
      zoomPercent: 100,
    });

    expect(preview.valid).toBe(true);
    expect(preview.reason).toBeUndefined();
    expect(preview.reservation.tableId).toBe("T1");
    expect(preview.reservation.partySize).toBe(table.capacity.min);
    expect(preview.reservation.startTime).toBe("2025-10-15T19:00:00-03:00");
    expect(preview.reservation.endTime).toBe("2025-10-15T20:00:00-03:00");
    expect(preview.reservation.durationMinutes).toBe(60);
  });

  it("marks reservation creation preview invalid when it overlaps another reservation", () => {
    const existing = buildReservation({
      id: "R1",
      startTime: "2025-10-15T20:00:00-03:00",
      endTime: "2025-10-15T21:00:00-03:00",
    });

    const preview = buildCreatePreview({
      originClientX: 0,
      nextClientX: 0,
      sourceOffsetMinutes: 540,
      dateKey: "2025-10-15",
      table,
      targetRecord: buildRecord("2025-10-15", [existing]),
      timelineStart: dayjs("2025-10-15T11:00:00-03:00"),
      timelineEnd: dayjs("2025-10-16T00:00:00-03:00"),
      zoomPercent: 100,
    });

    expect(preview.valid).toBe(false);
    expect(preview.reason).toBe("overlap");
  });
});
