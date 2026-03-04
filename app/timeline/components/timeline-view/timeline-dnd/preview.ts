import dayjs, { type Dayjs } from "dayjs";
import {
  MAX_RESERVATION_MINUTES,
  MIN_RESERVATION_MINUTES,
  SLOT_MINUTES,
  SLOT_WIDTH_PX,
  TIMELINE_DURATION_MINUTES,
} from "@/core/constants";
import type { ReservationTimelineRecord } from "@/core/types";
import { getTimelineWindow } from "../domain/timeline-window";
import type { SelectionReservation, SelectionTable } from "../types";
import type {
  ActiveResizeState,
  RowTarget,
  TimelineDragPreview,
} from "./types";
import { getMoveValidationReason } from "./validation";

/**
 * Input required to build a drag move preview.
 */
type BuildDragPreviewInput = {
  reservationEntityKey: string;
  sourceReservation: SelectionReservation;
  sourceOffsetMinutes: number;
  target: RowTarget;
  transformX: number;
  records: ReservationTimelineRecord[];
  tableById: Map<string, SelectionTable>;
  zoomPercent: number;
};

/**
 * Input required to build a resize preview from pointer movement.
 */
type BuildResizePreviewInput = {
  state: ActiveResizeState;
  nextClientX: number;
  zoomPercent: number;
};

/**
 * Computes real-time preview for drag move interactions.
 *
 * Rules:
 * - Horizontal movement snaps to 15-minute slots.
 * - Movement is clamped inside timeline bounds.
 * - Candidate is validated against overlap/capacity/service-hours.
 */
export function buildDragPreview({
  reservationEntityKey,
  sourceReservation,
  sourceOffsetMinutes,
  target,
  transformX,
  records,
  tableById,
  zoomPercent,
}: BuildDragPreviewInput): TimelineDragPreview | null {
  const targetRecord = records.find((record) => record.date === target.dateKey);
  const targetTable = tableById.get(target.tableId);

  if (!targetRecord || !targetTable) {
    return null;
  }

  const { timelineStart, timelineEnd } = getTimelineWindow(
    target.dateKey,
    targetRecord.restaurant.timezone,
  );

  const zoomScaledSlotWidth = SLOT_WIDTH_PX * (zoomPercent / 100);
  const deltaSlots =
    zoomScaledSlotWidth > 0 ? Math.round(transformX / zoomScaledSlotWidth) : 0;
  const deltaMinutes = deltaSlots * SLOT_MINUTES;

  const maxOffsetMinutes = Math.max(
    0,
    TIMELINE_DURATION_MINUTES - sourceReservation.durationMinutes,
  );
  const nextOffsetMinutes = clamp(
    sourceOffsetMinutes + deltaMinutes,
    0,
    maxOffsetMinutes,
  );
  const startTime = timelineStart.add(nextOffsetMinutes, "minute");
  const endTime = startTime.add(sourceReservation.durationMinutes, "minute");
  const candidate: SelectionReservation = {
    ...sourceReservation,
    tableId: target.tableId,
    startTime: startTime.format(),
    endTime: endTime.format(),
  };

  const reason = getMoveValidationReason({
    candidate,
    targetDateKey: target.dateKey,
    targetTable,
    targetRecord,
    sourceReservationEntityKey: reservationEntityKey,
  });

  return {
    reservation: candidate,
    timelineStart,
    timelineEnd,
    valid: !reason,
    reason,
  };
}

/**
 * Computes real-time preview for resize interactions.
 *
 * Rules:
 * - Pointer delta snaps to 15-minute slots.
 * - Start/end edge edits obey min/max duration.
 * - Candidate is validated against overlap/capacity/service-hours.
 */
export function buildResizePreview({
  state,
  nextClientX,
  zoomPercent,
}: BuildResizePreviewInput): TimelineDragPreview {
  const zoomScaledSlotWidth = SLOT_WIDTH_PX * (zoomPercent / 100);
  const deltaSlots =
    zoomScaledSlotWidth > 0
      ? Math.round((nextClientX - state.originClientX) / zoomScaledSlotWidth)
      : 0;
  const deltaMinutes = deltaSlots * SLOT_MINUTES;

  const candidate = getResizedReservation({
    sourceReservation: state.sourceReservation,
    edge: state.edge,
    deltaMinutes,
    timelineStart: state.timelineStart,
    timelineEnd: state.timelineEnd,
  });
  const reason = getMoveValidationReason({
    candidate,
    targetDateKey: state.targetDateKey,
    targetTable: state.targetTable,
    targetRecord: state.targetRecord,
    sourceReservationEntityKey: state.reservationEntityKey,
  });

  return {
    reservation: candidate,
    timelineStart: state.timelineStart,
    timelineEnd: state.timelineEnd,
    valid: !reason,
    reason,
  };
}

/**
 * Returns reservation to commit only when preview is valid.
 */
export function getCommitReservationFromPreview(preview: TimelineDragPreview) {
  return preview.valid ? preview.reservation : null;
}

/**
 * Computes a slot-snapped resized reservation candidate on the requested edge.
 */
export function getResizedReservation({
  sourceReservation,
  edge,
  deltaMinutes,
  timelineStart,
  timelineEnd,
}: {
  sourceReservation: SelectionReservation;
  edge: ActiveResizeState["edge"];
  deltaMinutes: number;
  timelineStart: Dayjs;
  timelineEnd: Dayjs;
}): SelectionReservation {
  const sourceStart = dayjs(sourceReservation.startTime);
  const sourceEnd = dayjs(sourceReservation.endTime);

  if (edge === "start") {
    const proposedStart = sourceStart.add(deltaMinutes, "minute");
    const minStart = maxDayjs(
      timelineStart,
      sourceEnd.subtract(MAX_RESERVATION_MINUTES, "minute"),
    );
    const maxStart = sourceEnd.subtract(MIN_RESERVATION_MINUTES, "minute");
    const clampedStart = clampDayjs(proposedStart, minStart, maxStart);
    const durationMinutes = sourceEnd.diff(clampedStart, "minute");

    return {
      ...sourceReservation,
      startTime: clampedStart.format(),
      endTime: sourceEnd.format(),
      durationMinutes,
    };
  }

  const proposedEnd = sourceEnd.add(deltaMinutes, "minute");
  const minEnd = sourceStart.add(MIN_RESERVATION_MINUTES, "minute");
  const maxEnd = minDayjs(
    timelineEnd,
    sourceStart.add(MAX_RESERVATION_MINUTES, "minute"),
  );
  const clampedEnd = clampDayjs(proposedEnd, minEnd, maxEnd);
  const durationMinutes = clampedEnd.diff(sourceStart, "minute");

  return {
    ...sourceReservation,
    startTime: sourceStart.format(),
    endTime: clampedEnd.format(),
    durationMinutes,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function clampDayjs(value: Dayjs, min: Dayjs, max: Dayjs) {
  if (value.isBefore(min)) {
    return min;
  }

  if (value.isAfter(max)) {
    return max;
  }

  return value;
}

function minDayjs(a: Dayjs, b: Dayjs) {
  return a.isBefore(b) ? a : b;
}

function maxDayjs(a: Dayjs, b: Dayjs) {
  return a.isAfter(b) ? a : b;
}
