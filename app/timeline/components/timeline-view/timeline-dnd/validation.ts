import dayjs from "dayjs";
import { isWithinServiceHours } from "@/core/service-hours";
import type {
  DateKey,
  MoveValidationReason,
  ReservationTimelineRecord,
} from "@/core/types";
import { getTimelineWindow } from "../domain/timeline-window";
import type { SelectionReservation, SelectionTable } from "../types";
import { getReservationEntityKey } from "../utils";

/**
 * Validates a candidate reservation placement against business constraints.
 *
 * Constraints enforced:
 * - Candidate must remain inside timeline window.
 * - Party size must be within target table capacity.
 * - Candidate interval must fit service hours (including cross-midnight windows).
 * - Candidate cannot overlap another reservation on same table.
 */
export function getMoveValidationReason({
  candidate,
  targetDateKey,
  targetTable,
  targetRecord,
  sourceReservationEntityKey,
}: {
  candidate: SelectionReservation;
  targetDateKey: DateKey;
  targetTable: SelectionTable;
  targetRecord: ReservationTimelineRecord;
  sourceReservationEntityKey: string;
}): MoveValidationReason | undefined {
  const candidateStart = dayjs(candidate.startTime);
  const candidateEnd = dayjs(candidate.endTime);
  const { timelineStart, timelineEnd } = getTimelineWindow(
    targetDateKey,
    targetRecord.restaurant.timezone,
  );

  if (
    candidateStart.isBefore(timelineStart) ||
    candidateEnd.isAfter(timelineEnd) ||
    !candidateEnd.isAfter(candidateStart)
  ) {
    return "outside_timeline";
  }

  if (
    candidate.partySize < targetTable.capacity.min ||
    candidate.partySize > targetTable.capacity.max
  ) {
    return "capacity_exceeded";
  }

  if (
    !isWithinServiceHours(
      candidateStart,
      candidateEnd,
      targetDateKey,
      targetRecord.restaurant.serviceHours,
      targetRecord.restaurant.timezone,
    )
  ) {
    return "outside_service_hours";
  }

  const hasOverlap = targetRecord.reservations.some((reservation) => {
    if (getReservationEntityKey(reservation) === sourceReservationEntityKey) {
      return false;
    }

    if (reservation.tableId !== candidate.tableId) {
      return false;
    }

    const existingStart = dayjs(reservation.startTime);
    const existingEnd = dayjs(reservation.endTime);

    return (
      candidateStart.isBefore(existingEnd) &&
      candidateEnd.isAfter(existingStart)
    );
  });

  if (hasOverlap) {
    return "overlap";
  }

  return undefined;
}

export { isWithinServiceHours } from "@/core/service-hours";
