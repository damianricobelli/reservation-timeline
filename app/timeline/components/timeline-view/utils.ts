import dayjs, { type Dayjs } from "dayjs";
import {
  SLOT_MINUTES,
  SLOT_WIDTH_PX,
  TIMELINE_DURATION_MINUTES,
  TIMELINE_START_HOUR,
  TOTAL_SLOTS,
} from "@/core/constants";
import type {
  ReservationsByDateAndTable,
  ReservationsByTable,
  SelectionReservation,
  SelectionSectorId,
  SelectionTable,
  SelectionTableId,
  TablesBySector,
} from "./types";

const PRIORITY_LABEL_BY_PRIORITY: Record<
  SelectionReservation["priority"],
  string | null
> = {
  STANDARD: null,
  VIP: "VIP",
  LARGE_GROUP: "Large Group",
};

const STATUS_LABEL_BY_STATUS: Record<SelectionReservation["status"], string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SEATED: "Seated",
  FINISHED: "Finished",
  NO_SHOW: "No Show",
  CANCELLED: "Cancelled",
};

export const SLOT_LABELS = Array.from({ length: TOTAL_SLOTS }, (_, index) =>
  formatTimeLabel(index),
);

// labels/formatting
export function formatTimeRange(reservation: SelectionReservation) {
  return `${dayjs(reservation.startTime).format("HH:mm")}-${dayjs(reservation.endTime).format("HH:mm")}`;
}

export function formatTimeLabel(slotIndex: number) {
  const absoluteMinutes = TIMELINE_START_HOUR * 60 + slotIndex * SLOT_MINUTES;
  const wrappedMinutes = absoluteMinutes % (24 * 60);
  const hours = Math.floor(wrappedMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (wrappedMinutes % 60).toString().padStart(2, "0");

  return `${hours}:${minutes}`;
}

export function formatPriorityLabel(
  priority: SelectionReservation["priority"],
) {
  return PRIORITY_LABEL_BY_PRIORITY[priority];
}

export function getStatusLabel(status: SelectionReservation["status"]) {
  return STATUS_LABEL_BY_STATUS[status];
}

export function getReservationRenderKey(reservation: SelectionReservation) {
  return `${reservation.id}-${reservation.tableId}-${reservation.startTime}`;
}

export function getTablesBySector(tables: SelectionTable[]): TablesBySector {
  const map = new Map<SelectionSectorId, SelectionTable[]>();

  tables.forEach((table) => {
    const current = map.get(table.sectorId) ?? [];
    current.push(table);
    map.set(table.sectorId, current);
  });

  return map;
}

export function getTimelineStartForDate(dateKey: string) {
  return dayjs(dateKey)
    .hour(TIMELINE_START_HOUR)
    .minute(0)
    .second(0)
    .millisecond(0);
}

export function getTimelineEndForDate(dateKey: string) {
  return getTimelineStartForDate(dateKey).add(
    TIMELINE_DURATION_MINUTES,
    "minute",
  );
}

export function getMinutesFromStart(
  date: Dayjs,
  startHour = TIMELINE_START_HOUR,
) {
  const start = date
    .startOf("day")
    .hour(startHour)
    .minute(0)
    .second(0)
    .millisecond(0);
  return date.diff(start, "minute", true);
}

export function getSlotOffsetPx(startTime: Dayjs, timelineStart: Dayjs) {
  const minutes = startTime.diff(timelineStart, "minute", true);
  return (minutes / SLOT_MINUTES) * SLOT_WIDTH_PX;
}

export function getDurationWidthPx(
  startTime: Dayjs,
  endTime: Dayjs,
  timelineStart: Dayjs,
  timelineEnd: Dayjs,
) {
  const clampedStart = startTime.isBefore(timelineStart)
    ? timelineStart
    : startTime;
  const clampedEnd = endTime.isAfter(timelineEnd) ? timelineEnd : endTime;

  if (!clampedEnd.isAfter(clampedStart)) {
    return 0;
  }

  const durationMinutes = clampedEnd.diff(clampedStart, "minute", true);
  return (durationMinutes / SLOT_MINUTES) * SLOT_WIDTH_PX;
}

type ReservationBlockLayoutInput = {
  reservationStart: Dayjs;
  reservationEnd: Dayjs;
  timelineStart: Dayjs;
  timelineEnd: Dayjs;
  insetX?: number;
};

type ReservationBlockLayout = {
  left: number;
  width: number;
  hidden: boolean;
};

export function getReservationBlockLayout({
  reservationStart,
  reservationEnd,
  timelineStart,
  timelineEnd,
  insetX = 0,
}: ReservationBlockLayoutInput): ReservationBlockLayout {
  const clampedReservationStart = reservationStart.isBefore(timelineStart)
    ? timelineStart
    : reservationStart;
  const left = getSlotOffsetPx(clampedReservationStart, timelineStart);
  const width = getDurationWidthPx(
    reservationStart,
    reservationEnd,
    timelineStart,
    timelineEnd,
  );

  const paddedLeft = left + insetX;
  const paddedWidth = Math.max(0, width - insetX * 2);

  return {
    left: paddedLeft,
    width: paddedWidth,
    hidden: paddedWidth <= 0,
  };
}

export function toZoomScaledX(px: number) {
  return `calc(${px}px * var(--timeline-zoom))`;
}

export function buildReservationsByDateAndTable(
  reservations: SelectionReservation[],
  dateKeys: string[],
): ReservationsByDateAndTable {
  const result = new Map<string, ReservationsByTable>();

  const windowsByDate = new Map(
    dateKeys.map((dateKey) => [
      dateKey,
      {
        start: getTimelineStartForDate(dateKey),
        end: getTimelineEndForDate(dateKey),
      },
    ]),
  );

  dateKeys.forEach((dateKey) => {
    result.set(dateKey, new Map<SelectionTableId, SelectionReservation[]>());
  });

  reservations.forEach((reservation) => {
    const reservationStart = dayjs(reservation.startTime);
    const reservationEnd = dayjs(reservation.endTime);

    dateKeys.forEach((dateKey) => {
      const timelineWindow = windowsByDate.get(dateKey);

      if (!timelineWindow) {
        return;
      }

      if (
        !reservationStart.isBefore(timelineWindow.end) ||
        !reservationEnd.isAfter(timelineWindow.start)
      ) {
        return;
      }

      const reservationsByTable = result.get(dateKey);

      if (!reservationsByTable) {
        return;
      }

      const tableReservations =
        reservationsByTable.get(reservation.tableId) ?? [];
      tableReservations.push(reservation);
      reservationsByTable.set(reservation.tableId, tableReservations);
    });
  });

  result.forEach((reservationsByTable) => {
    reservationsByTable.forEach((tableReservations) => {
      tableReservations.sort(
        (a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf(),
      );
    });
  });

  return result;
}

export function getDayReservationCount(
  reservationsByTable: ReservationsByTable | undefined,
) {
  if (!reservationsByTable) {
    return 0;
  }

  return Array.from(reservationsByTable.values()).reduce(
    (count, tableReservations) => count + tableReservations.length,
    0,
  );
}
