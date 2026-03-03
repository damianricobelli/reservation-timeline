import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
  TIMELINE_DURATION_MINUTES,
  TIMELINE_START_HOUR,
} from "@/core/constants";
import { isWithinServiceHours } from "@/core/service-hours";
import type {
  DateKey,
  MoveValidationReason,
  ReservationTimelineRecord,
} from "@/core/types";
import type { SelectionReservation, SelectionTable } from "../types";
import { getReservationEntityKey } from "../utils";

dayjs.extend(utc);
dayjs.extend(timezone);

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
  const tz = targetRecord.restaurant.timezone;
  const timelineStart = dayjs
    .tz(targetDateKey, tz)
    .hour(TIMELINE_START_HOUR)
    .minute(0)
    .second(0)
    .millisecond(0);
  const timelineEnd = timelineStart.add(TIMELINE_DURATION_MINUTES, "minute");

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
      tz,
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
