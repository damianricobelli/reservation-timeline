import { MIN_RESERVATION_MINUTES, SLOT_MINUTES } from "@/core/constants";
import type {
  DateKey,
  MoveValidationReason,
  ReservationTimelineRecord,
} from "@/core/types";
import { getMoveValidationReason } from "../timeline-dnd/validation";
import type { SelectionReservation, SelectionTable } from "../types";

const CREATE_MAX_DURATION_MINUTES = 6 * 60;
const CREATE_RESERVATION_ENTITY_KEY = "__timeline-create__";

export type TimelineCreateValidationReason =
  | MoveValidationReason
  | "duration_too_short"
  | "duration_too_long";

export function getCreateValidationReason({
  candidate,
  targetDateKey,
  targetTable,
  targetRecord,
}: {
  candidate: SelectionReservation;
  targetDateKey: DateKey;
  targetTable: SelectionTable;
  targetRecord: ReservationTimelineRecord;
}): TimelineCreateValidationReason | undefined {
  if (candidate.durationMinutes < MIN_RESERVATION_MINUTES) {
    return "duration_too_short";
  }

  if (candidate.durationMinutes > CREATE_MAX_DURATION_MINUTES) {
    return "duration_too_long";
  }

  if (candidate.durationMinutes % SLOT_MINUTES !== 0) {
    return "outside_timeline";
  }

  return getMoveValidationReason({
    candidate,
    targetDateKey,
    targetTable,
    targetRecord,
    sourceReservationEntityKey: CREATE_RESERVATION_ENTITY_KEY,
  });
}
