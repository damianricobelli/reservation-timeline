import type { DragDropEventHandlers } from "@dnd-kit/react";
import dayjs, { type Dayjs } from "dayjs";
import {
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  MAX_RESERVATION_MINUTES,
  MIN_RESERVATION_MINUTES,
  SLOT_MINUTES,
  SLOT_WIDTH_PX,
  TIMELINE_DURATION_MINUTES,
} from "@/core/constants";
import type {
  Reservation,
  ReservationTimelineRecord,
  ServiceHour,
} from "@/core/types";
import type { SelectionReservation, SelectionTable } from "./types";
import {
  getReservationEntityKey,
  getTimelineEndForDate,
  getTimelineStartForDate,
} from "./utils";

const DATE_KEY_FORMAT = "YYYY-MM-DD";
const RESERVATION_DRAG_KIND = "timeline-reservation";
const ROW_DROP_KIND = "timeline-row";

/**
 * Data payload attached to each draggable reservation block.
 * Used to resolve the logical reservation during DnD events.
 */
export type ReservationDraggableData = {
  kind: typeof RESERVATION_DRAG_KIND;
  reservationEntityKey: string;
};

/**
 * Data payload attached to each droppable timeline row (date + table).
 */
export type RowDroppableData = {
  kind: typeof ROW_DROP_KIND;
  dateKey: string;
  tableId: string;
};

type RowTarget = {
  dateKey: string;
  tableId: string;
};

export type ResizeEdge = "start" | "end";

/**
 * Validation failure reasons when evaluating a potential drop target.
 */
export type MoveValidationReason =
  | "overlap"
  | "capacity_exceeded"
  | "outside_service_hours"
  | "outside_timeline";

/**
 * Real-time drag preview model used by the overlay block.
 */
export type TimelineDragPreview = {
  reservation: SelectionReservation;
  timelineStart: Dayjs;
  timelineEnd: Dayjs;
  valid: boolean;
  reason?: MoveValidationReason;
};

type ActiveDragState = {
  reservationEntityKey: string;
  sourceReservation: SelectionReservation;
  sourceOffsetMinutes: number;
  target: RowTarget;
  preview: TimelineDragPreview;
};

type ActiveResizeState = {
  reservationEntityKey: string;
  pointerId: number;
  edge: ResizeEdge;
  originClientX: number;
  sourceReservation: SelectionReservation;
  targetDateKey: string;
  targetTable: SelectionTable;
  targetRecord: ReservationTimelineRecord;
  timelineStart: Dayjs;
  timelineEnd: Dayjs;
  preview: TimelineDragPreview;
};

type TimelineDragOperation = {
  target: {
    data?: unknown;
  } | null;
  transform: {
    x: number;
  };
};

type UseTimelineReservationDndInput = {
  records: ReservationTimelineRecord[];
  setRecords: Dispatch<SetStateAction<ReservationTimelineRecord[]>>;
  tableById: Map<string, SelectionTable>;
  zoomPercent: number;
};

type DraggableAttributes = {
  id: string;
  data: ReservationDraggableData;
};

type DroppableAttributes = {
  id: string;
  data: RowDroppableData;
};

export type ResizeHandleProps = {
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onLostPointerCapture: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

type ProviderHandlers = Pick<
  DragDropEventHandlers,
  "onDragStart" | "onDragMove" | "onDragOver" | "onDragEnd"
>;

/**
 * Minimal API exposed to timeline UI components for reservation drag-and-drop.
 */
export type TimelineReservationDndApi = {
  providerHandlers: ProviderHandlers;
  preview: TimelineDragPreview | null;
  getReservationDraggableAttributes: (
    reservation: SelectionReservation,
  ) => DraggableAttributes;
  getRowDroppableAttributes: (
    dateKey: string,
    tableId: string,
  ) => DroppableAttributes;
  getResizeHandleProps: (
    reservation: SelectionReservation,
    edge: ResizeEdge,
  ) => ResizeHandleProps;
  getResizePreview: (
    reservation: SelectionReservation,
  ) => TimelineDragPreview | null;
};

/**
 * Encapsulates reservation drag-and-drop behavior for the timeline.
 *
 * Features:
 * - 15-minute X-axis snapping (zoom-aware).
 * - Table row targeting through droppable rows.
 * - Real-time preview of the candidate reservation.
 * - Constraint validation (overlap, service hours, table capacity, timeline bounds).
 * - Commit on valid drop only.
 */
export function useTimelineReservationDnd({
  records,
  setRecords,
  tableById,
  zoomPercent,
}: UseTimelineReservationDndInput): TimelineReservationDndApi {
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);
  const [activeResize, setActiveResize] = useState<ActiveResizeState | null>(
    null,
  );

  const buildPreview = useCallback(
    ({
      reservationEntityKey,
      sourceReservation,
      sourceOffsetMinutes,
      target,
      transformX,
    }: {
      reservationEntityKey: string;
      sourceReservation: SelectionReservation;
      sourceOffsetMinutes: number;
      target: RowTarget;
      transformX: number;
    }): TimelineDragPreview | null => {
      const timelineStart = getTimelineStartForDate(target.dateKey);
      const timelineEnd = getTimelineEndForDate(target.dateKey);
      const targetRecord = records.find(
        (record) => record.date === target.dateKey,
      );
      const rowTable = tableById.get(target.tableId);

      if (!targetRecord || !rowTable) {
        return null;
      }

      // Snap horizontal movement to 15-minute slots at the current zoom level.
      const zoomScaledSlotWidth = SLOT_WIDTH_PX * (zoomPercent / 100);
      const deltaSlots =
        zoomScaledSlotWidth > 0
          ? Math.round(transformX / zoomScaledSlotWidth)
          : 0;
      const deltaMinutes = deltaSlots * SLOT_MINUTES;
      // Clamp the reservation to the visible timeline bounds.
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
      const endTime = startTime.add(
        sourceReservation.durationMinutes,
        "minute",
      );
      const candidate: SelectionReservation = {
        ...sourceReservation,
        tableId: target.tableId,
        startTime: startTime.format(),
        endTime: endTime.format(),
      };
      const reason = getMoveValidationReason({
        candidate,
        targetDateKey: target.dateKey,
        targetTable: rowTable,
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
    },
    [records, tableById, zoomPercent],
  );

  const getTargetFromOperation = useCallback(
    (operation: TimelineDragOperation): RowTarget | null => {
      const targetData = operation.target?.data;

      if (isRowDroppableData(targetData)) {
        return {
          dateKey: targetData.dateKey,
          tableId: targetData.tableId,
        };
      }

      return null;
    },
    [],
  );

  const buildResizePreview = useCallback(
    (state: ActiveResizeState, nextClientX: number): TimelineDragPreview => {
      const zoomScaledSlotWidth = SLOT_WIDTH_PX * (zoomPercent / 100);
      const deltaSlots =
        zoomScaledSlotWidth > 0
          ? Math.round(
              (nextClientX - state.originClientX) / zoomScaledSlotWidth,
            )
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
    },
    [zoomPercent],
  );

  const updatePreviewFromOperation = useCallback(
    (operation: TimelineDragOperation) => {
      setActiveDrag((current) => {
        if (!current) {
          return null;
        }

        const target = getTargetFromOperation(operation) ?? current.target;
        const nextPreview = buildPreview({
          reservationEntityKey: current.reservationEntityKey,
          sourceReservation: current.sourceReservation,
          sourceOffsetMinutes: current.sourceOffsetMinutes,
          target,
          transformX: operation.transform.x,
        });

        if (!nextPreview) {
          return current;
        }

        const previewUnchanged =
          current.preview.reservation.tableId ===
            nextPreview.reservation.tableId &&
          current.preview.reservation.startTime ===
            nextPreview.reservation.startTime &&
          current.preview.reservation.endTime ===
            nextPreview.reservation.endTime &&
          current.preview.valid === nextPreview.valid &&
          current.preview.reason === nextPreview.reason;
        const targetUnchanged =
          current.target.dateKey === target.dateKey &&
          current.target.tableId === target.tableId;

        if (previewUnchanged && targetUnchanged) {
          return current;
        }

        return {
          ...current,
          target,
          preview: nextPreview,
        };
      });
    },
    [buildPreview, getTargetFromOperation],
  );

  const handleDragStart = useCallback<
    NonNullable<ProviderHandlers["onDragStart"]>
  >(
    (event) => {
      const sourceData = event.operation.source?.data;

      if (!isReservationDraggableData(sourceData)) {
        return;
      }

      const sourceReservation = findReservationByEntityKey(
        records,
        sourceData.reservationEntityKey,
      );

      if (!sourceReservation) {
        return;
      }

      const sourceDateKey = dayjs(sourceReservation.startTime).format(
        DATE_KEY_FORMAT,
      );
      const sourceTimelineStart = getTimelineStartForDate(sourceDateKey);
      const sourceOffsetMinutes = dayjs(sourceReservation.startTime).diff(
        sourceTimelineStart,
        "minute",
      );
      const sourceTarget = {
        dateKey: sourceDateKey,
        tableId: sourceReservation.tableId,
      };
      const initialPreview = buildPreview({
        reservationEntityKey: sourceData.reservationEntityKey,
        sourceReservation,
        sourceOffsetMinutes,
        target: sourceTarget,
        transformX: event.operation.transform.x,
      });

      if (!initialPreview) {
        return;
      }

      setActiveDrag({
        reservationEntityKey: sourceData.reservationEntityKey,
        sourceReservation,
        sourceOffsetMinutes,
        target: sourceTarget,
        preview: initialPreview,
      });
    },
    [buildPreview, records],
  );

  const handleDragMove = useCallback<
    NonNullable<ProviderHandlers["onDragMove"]>
  >(
    (event) => {
      updatePreviewFromOperation(event.operation);
    },
    [updatePreviewFromOperation],
  );

  const handleDragOver = useCallback<
    NonNullable<ProviderHandlers["onDragOver"]>
  >(
    (event) => {
      updatePreviewFromOperation(event.operation);
    },
    [updatePreviewFromOperation],
  );

  const handleDragEnd = useCallback<NonNullable<ProviderHandlers["onDragEnd"]>>(
    (event) => {
      if (activeDrag && !event.canceled) {
        const target = getTargetFromOperation(event.operation);

        if (target) {
          const finalPreview = buildPreview({
            reservationEntityKey: activeDrag.reservationEntityKey,
            sourceReservation: activeDrag.sourceReservation,
            sourceOffsetMinutes: activeDrag.sourceOffsetMinutes,
            target,
            transformX: event.operation.transform.x,
          });

          if (finalPreview?.valid) {
            setRecords((previous) =>
              commitReservationMove(
                previous,
                activeDrag.reservationEntityKey,
                finalPreview.reservation,
              ),
            );
          }
        }
      }

      setActiveDrag(null);
    },
    [activeDrag, buildPreview, getTargetFromOperation, setRecords],
  );

  const providerHandlers = useMemo<ProviderHandlers>(
    () => ({
      onDragStart: handleDragStart,
      onDragMove: handleDragMove,
      onDragOver: handleDragOver,
      onDragEnd: handleDragEnd,
    }),
    [handleDragEnd, handleDragMove, handleDragOver, handleDragStart],
  );

  const getReservationDraggableAttributes = useCallback(
    (reservation: SelectionReservation): DraggableAttributes => {
      const reservationEntityKey = getReservationEntityKey(reservation);
      return {
        id: getReservationDraggableId(reservationEntityKey),
        data: {
          kind: RESERVATION_DRAG_KIND,
          reservationEntityKey,
        },
      };
    },
    [],
  );

  const getRowDroppableAttributes = useCallback(
    (dateKey: string, tableId: string): DroppableAttributes => {
      return {
        id: getRowDroppableId(dateKey, tableId),
        data: {
          kind: ROW_DROP_KIND,
          dateKey,
          tableId,
        },
      };
    },
    [],
  );

  const getResizeHandleProps = useCallback(
    (
      reservation: SelectionReservation,
      edge: ResizeEdge,
    ): ResizeHandleProps => {
      const reservationEntityKey = getReservationEntityKey(reservation);

      const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (activeDrag) {
          return;
        }

        if (activeResize) {
          setActiveResize(null);
        }

        const targetDateKey = dayjs(reservation.startTime).format(
          DATE_KEY_FORMAT,
        );
        const targetRecord = records.find(
          (record) => record.date === targetDateKey,
        );
        const targetTable = tableById.get(reservation.tableId);

        if (!targetRecord || !targetTable) {
          return;
        }

        const timelineStart = getTimelineStartForDate(targetDateKey);
        const timelineEnd = getTimelineEndForDate(targetDateKey);
        const preview: TimelineDragPreview = {
          reservation,
          timelineStart,
          timelineEnd,
          valid: true,
        };

        event.currentTarget.setPointerCapture(event.pointerId);
        setActiveResize({
          reservationEntityKey,
          pointerId: event.pointerId,
          edge,
          originClientX: event.clientX,
          sourceReservation: reservation,
          targetDateKey,
          targetTable,
          targetRecord,
          timelineStart,
          timelineEnd,
          preview,
        });
      };

      const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        const { pointerId, clientX } = event;

        setActiveResize((current) => {
          if (
            !current ||
            current.pointerId !== pointerId ||
            current.reservationEntityKey !== reservationEntityKey ||
            current.edge !== edge
          ) {
            return current;
          }

          const nextPreview = buildResizePreview(current, clientX);
          const previewUnchanged =
            current.preview.reservation.startTime ===
              nextPreview.reservation.startTime &&
            current.preview.reservation.endTime ===
              nextPreview.reservation.endTime &&
            current.preview.valid === nextPreview.valid &&
            current.preview.reason === nextPreview.reason;

          if (previewUnchanged) {
            return current;
          }

          return {
            ...current,
            preview: nextPreview,
          };
        });
      };

      const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const { pointerId } = event;
        let nextReservationToCommit: SelectionReservation | null = null;

        setActiveResize((current) => {
          if (
            !current ||
            current.pointerId !== pointerId ||
            current.reservationEntityKey !== reservationEntityKey ||
            current.edge !== edge
          ) {
            return current;
          }

          if (current.preview.valid) {
            nextReservationToCommit = current.preview.reservation;
          }

          return null;
        });

        if (nextReservationToCommit) {
          const committedReservation = nextReservationToCommit;
          setRecords((previous) =>
            commitReservationMove(
              previous,
              reservationEntityKey,
              committedReservation,
            ),
          );
        }

        if (event.currentTarget.hasPointerCapture(pointerId)) {
          event.currentTarget.releasePointerCapture(pointerId);
        }
      };

      const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        const { pointerId } = event;

        setActiveResize((current) => {
          if (!current || current.pointerId !== pointerId) {
            return current;
          }

          return null;
        });

        if (event.currentTarget.hasPointerCapture(pointerId)) {
          event.currentTarget.releasePointerCapture(pointerId);
        }
      };

      const onLostPointerCapture = (
        event: ReactPointerEvent<HTMLDivElement>,
      ) => {
        const { pointerId } = event;

        setActiveResize((current) => {
          if (!current || current.pointerId !== pointerId) {
            return current;
          }

          return null;
        });
      };

      return {
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
        onLostPointerCapture,
      };
    },
    [
      activeDrag,
      activeResize,
      buildResizePreview,
      records,
      setRecords,
      tableById,
    ],
  );

  const getResizePreview = useCallback(
    (reservation: SelectionReservation): TimelineDragPreview | null => {
      if (!activeResize) {
        return null;
      }

      const reservationEntityKey = getReservationEntityKey(reservation);

      if (activeResize.reservationEntityKey !== reservationEntityKey) {
        return null;
      }

      return activeResize.preview;
    },
    [activeResize],
  );

  return {
    providerHandlers,
    preview: activeDrag?.preview ?? null,
    getReservationDraggableAttributes,
    getRowDroppableAttributes,
    getResizeHandleProps,
    getResizePreview,
  };
}

/**
 * Locates a reservation by stable entity key across all loaded timeline records.
 */
function findReservationByEntityKey(
  records: ReservationTimelineRecord[],
  reservationEntityKey: string,
): SelectionReservation | null {
  for (const record of records) {
    const match = record.reservations.find((reservation) => {
      return getReservationEntityKey(reservation) === reservationEntityKey;
    });

    if (match) {
      return match;
    }
  }

  return null;
}

/**
 * Applies a reservation move to the in-memory timeline records.
 * Handles same-day moves (replace in-place) and cross-day moves (remove + append).
 */
function commitReservationMove(
  records: ReservationTimelineRecord[],
  reservationEntityKey: string,
  nextReservation: SelectionReservation,
) {
  let sourceRecordIndex = -1;
  let sourceReservationIndex = -1;

  records.some((record, recordIndex) => {
    const reservationIndex = record.reservations.findIndex((reservation) => {
      return getReservationEntityKey(reservation) === reservationEntityKey;
    });

    if (reservationIndex < 0) {
      return false;
    }

    sourceRecordIndex = recordIndex;
    sourceReservationIndex = reservationIndex;
    return true;
  });

  if (sourceRecordIndex < 0 || sourceReservationIndex < 0) {
    return records;
  }

  const targetDateKey = dayjs(nextReservation.startTime).format(
    DATE_KEY_FORMAT,
  );
  const fallbackTargetRecordIndex = sourceRecordIndex;
  const targetRecordIndex = records.findIndex(
    (record) => record.date === targetDateKey,
  );
  const normalizedTargetRecordIndex =
    targetRecordIndex >= 0 ? targetRecordIndex : fallbackTargetRecordIndex;

  if (normalizedTargetRecordIndex === sourceRecordIndex) {
    return records.map((record, recordIndex) => {
      if (recordIndex !== sourceRecordIndex) {
        return record;
      }

      const reservations = record.reservations.map((reservation, index) => {
        if (index !== sourceReservationIndex) {
          return reservation;
        }

        return nextReservation;
      });

      reservations.sort(sortByStartTime);

      return {
        ...record,
        reservations,
      };
    });
  }

  return records.map((record, recordIndex) => {
    if (recordIndex === sourceRecordIndex) {
      return {
        ...record,
        reservations: record.reservations.filter(
          (_reservation, index) => index !== sourceReservationIndex,
        ),
      };
    }

    if (recordIndex === normalizedTargetRecordIndex) {
      const reservations = [...record.reservations, nextReservation];
      reservations.sort(sortByStartTime);
      return {
        ...record,
        reservations,
      };
    }

    return record;
  });
}

/**
 * Sort helper to keep reservations ordered by start time after a move.
 */
function sortByStartTime(a: Reservation, b: Reservation) {
  return dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf();
}

/**
 * Validates a candidate reservation placement.
 * Returns the first blocking reason, or `undefined` when placement is valid.
 */
function getMoveValidationReason({
  candidate,
  targetDateKey,
  targetTable,
  targetRecord,
  sourceReservationEntityKey,
}: {
  candidate: SelectionReservation;
  targetDateKey: string;
  targetTable: SelectionTable;
  targetRecord: ReservationTimelineRecord;
  sourceReservationEntityKey: string;
}): MoveValidationReason | undefined {
  const candidateStart = dayjs(candidate.startTime);
  const candidateEnd = dayjs(candidate.endTime);
  const timelineStart = getTimelineStartForDate(targetDateKey);
  const timelineEnd = getTimelineEndForDate(targetDateKey);

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

/**
 * Checks whether a reservation interval is fully contained in at least one service window.
 */
function isWithinServiceHours(
  startTime: Dayjs,
  endTime: Dayjs,
  dateKey: string,
  serviceHours: ServiceHour[],
) {
  if (serviceHours.length === 0) {
    return true;
  }

  return serviceHours.some((serviceHour) => {
    const start = parseServiceHourDate(dateKey, serviceHour.start);
    let end = parseServiceHourDate(dateKey, serviceHour.end);

    if (!end.isAfter(start)) {
      end = end.add(1, "day");
    }

    return (
      (startTime.isAfter(start) || startTime.isSame(start)) &&
      (endTime.isBefore(end) || endTime.isSame(end))
    );
  });
}

/**
 * Parses "HH:mm" into a Dayjs timestamp for the given date.
 */
function parseServiceHourDate(dateKey: string, time: string) {
  const [hourPart, minutePart] = time.split(":");
  const hour = Number.parseInt(hourPart ?? "0", 10);
  const minute = Number.parseInt(minutePart ?? "0", 10);

  return dayjs(dateKey)
    .hour(Number.isNaN(hour) ? 0 : hour)
    .minute(Number.isNaN(minute) ? 0 : minute)
    .second(0)
    .millisecond(0);
}

/**
 * Numeric clamp utility.
 */
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Clamps a Dayjs value between min and max.
 */
function clampDayjs(value: Dayjs, min: Dayjs, max: Dayjs) {
  if (value.isBefore(min)) {
    return min;
  }

  if (value.isAfter(max)) {
    return max;
  }

  return value;
}

/**
 * Computes a slot-snapped resized reservation candidate on the requested edge.
 */
function getResizedReservation({
  sourceReservation,
  edge,
  deltaMinutes,
  timelineStart,
  timelineEnd,
}: {
  sourceReservation: SelectionReservation;
  edge: ResizeEdge;
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

function minDayjs(a: Dayjs, b: Dayjs) {
  return a.isBefore(b) ? a : b;
}

function maxDayjs(a: Dayjs, b: Dayjs) {
  return a.isAfter(b) ? a : b;
}

/**
 * Builds unique draggable id for dnd-kit registry.
 */
function getReservationDraggableId(reservationEntityKey: string) {
  return `reservation:${reservationEntityKey}`;
}

/**
 * Builds unique droppable id for dnd-kit registry.
 */
function getRowDroppableId(dateKey: string, tableId: string) {
  return `row:${dateKey}:${tableId}`;
}

/**
 * Runtime type guard for draggable payload.
 */
function isReservationDraggableData(
  data: unknown,
): data is ReservationDraggableData {
  if (!data || typeof data !== "object") {
    return false;
  }

  const value = data as Partial<ReservationDraggableData>;
  return (
    value.kind === RESERVATION_DRAG_KIND &&
    typeof value.reservationEntityKey === "string"
  );
}

/**
 * Runtime type guard for row droppable payload.
 */
function isRowDroppableData(data: unknown): data is RowDroppableData {
  if (!data || typeof data !== "object") {
    return false;
  }

  const value = data as Partial<RowDroppableData>;
  return (
    value.kind === ROW_DROP_KIND &&
    typeof value.dateKey === "string" &&
    typeof value.tableId === "string"
  );
}
