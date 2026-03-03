import dayjs from "dayjs";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import {
  DATE_KEY_FORMAT,
  RESERVATION_DRAG_KIND,
  ROW_DROP_KIND,
} from "./timeline-dnd/constants";
import {
  getReservationDraggableId,
  getRowDroppableId,
  isReservationDraggableData,
  isRowDroppableData,
} from "./timeline-dnd/ids-and-guards";
import {
  buildDragPreview,
  buildResizePreview,
  getCommitReservationFromPreview,
} from "./timeline-dnd/preview";
import {
  commitReservationMove,
  findReservationByEntityKey,
} from "./timeline-dnd/records";
import type {
  ActiveDragState,
  ActiveResizeState,
  DraggableAttributes,
  DroppableAttributes,
  ProviderHandlers,
  ResizeHandleProps,
  RowTarget,
  TimelineDragOperation,
  TimelineDragPreview,
  TimelineReservationDndApi,
  UseTimelineReservationDndInput,
} from "./timeline-dnd/types";
import {
  getReservationEntityKey,
  getTimelineEndForDate,
  getTimelineStartForDate,
} from "./utils";

export type { MoveValidationReason } from "@/core/types";
export type {
  ReservationDraggableData,
  ResizeEdge,
  ResizeHandleProps,
  RowDroppableData,
  TimelineDragPreview,
  TimelineReservationDndApi,
} from "./timeline-dnd/types";

/**
 * Encapsulates reservation drag-and-drop behavior for the timeline.
 *
 * Features:
 * - 15-minute X-axis snapping (zoom-aware).
 * - Table row targeting through droppable rows.
 * - Real-time preview of candidate reservation for drag move and resize.
 * - Constraint validation (overlap, service hours, table capacity, timeline bounds).
 * - Commit on valid interaction end only.
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

  /**
   * Builds drag move preview from current operation transform and target row.
   */
  const getDragPreview = useCallback(
    ({
      reservationEntityKey,
      sourceReservation,
      sourceOffsetMinutes,
      target,
      transformX,
    }: {
      reservationEntityKey: string;
      sourceReservation: ActiveDragState["sourceReservation"];
      sourceOffsetMinutes: number;
      target: RowTarget;
      transformX: number;
    }): TimelineDragPreview | null => {
      return buildDragPreview({
        reservationEntityKey,
        sourceReservation,
        sourceOffsetMinutes,
        target,
        transformX,
        records,
        tableById,
        zoomPercent,
      });
    },
    [records, tableById, zoomPercent],
  );

  /**
   * Extracts logical row target from dnd-kit operation payload.
   */
  const getTargetFromOperation = useCallback(
    (operation: TimelineDragOperation): RowTarget | null => {
      const targetData = operation.target?.data;

      if (!isRowDroppableData(targetData)) {
        return null;
      }

      return {
        dateKey: targetData.dateKey,
        tableId: targetData.tableId,
      };
    },
    [],
  );

  /**
   * Updates active drag preview as source transforms or row target changes.
   */
  const updatePreviewFromOperation = useCallback(
    (operation: TimelineDragOperation) => {
      setActiveDrag((current) => {
        if (!current) {
          return null;
        }

        const target = getTargetFromOperation(operation) ?? current.target;
        const nextPreview = getDragPreview({
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
    [getDragPreview, getTargetFromOperation],
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
      const initialPreview = getDragPreview({
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
    [getDragPreview, records],
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
          const finalPreview = getDragPreview({
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
    [activeDrag, getDragPreview, getTargetFromOperation, setRecords],
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
    (
      reservation: ActiveDragState["sourceReservation"],
    ): DraggableAttributes => {
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
    (
      dateKey: RowTarget["dateKey"],
      tableId: RowTarget["tableId"],
    ): DroppableAttributes => {
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
      reservation: ActiveDragState["sourceReservation"],
      edge: ActiveResizeState["edge"],
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

          const nextPreview = buildResizePreview({
            state: current,
            nextClientX: clientX,
            zoomPercent,
          });
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
        let nextReservationToCommit:
          | ActiveDragState["sourceReservation"]
          | null = null;

        setActiveResize((current) => {
          if (
            !current ||
            current.pointerId !== pointerId ||
            current.reservationEntityKey !== reservationEntityKey ||
            current.edge !== edge
          ) {
            return current;
          }

          nextReservationToCommit = getCommitReservationFromPreview(
            current.preview,
          );

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
    [activeDrag, activeResize, records, setRecords, tableById, zoomPercent],
  );

  const getResizePreview = useCallback(
    (
      reservation: ActiveDragState["sourceReservation"],
    ): TimelineDragPreview | null => {
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
