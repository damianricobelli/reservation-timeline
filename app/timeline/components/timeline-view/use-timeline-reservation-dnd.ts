import { useCallback } from "react";
import { RESERVATION_DRAG_KIND, ROW_DROP_KIND } from "./timeline-dnd/constants";
import {
  getReservationDraggableId,
  getRowDroppableId,
} from "./timeline-dnd/ids-and-guards";
import type {
  ActiveDragState,
  ActiveResizeState,
  DraggableAttributes,
  DroppableAttributes,
  ResizeHandleProps,
  TimelineReservationDndApi,
  UseTimelineReservationDndInput,
} from "./timeline-dnd/types";
import { useDragSession } from "./timeline-dnd/use-drag-session";
import { useResizeSession } from "./timeline-dnd/use-resize-session";
import { getReservationEntityKey } from "./utils";

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
 * This orchestrator composes two independent state machines:
 * - drag move session
 * - resize session
 */
export function useTimelineReservationDnd({
  records,
  setRecords,
  tableById,
  zoomPercent,
}: UseTimelineReservationDndInput): TimelineReservationDndApi {
  const dragSession = useDragSession({
    records,
    setRecords,
    tableById,
    zoomPercent,
  });

  const resizeSession = useResizeSession({
    isDragActive: dragSession.isDragActive,
    records,
    setRecords,
    tableById,
    zoomPercent,
  });

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
      reservation: ActiveDragState["sourceReservation"],
      edge: ActiveResizeState["edge"],
    ): ResizeHandleProps => {
      return resizeSession.getResizeHandleProps(reservation, edge);
    },
    [resizeSession],
  );

  return {
    providerHandlers: dragSession.providerHandlers,
    preview: dragSession.preview,
    getReservationDraggableAttributes,
    getRowDroppableAttributes,
    getResizeHandleProps,
    getResizePreview: resizeSession.getResizePreview,
  };
}
