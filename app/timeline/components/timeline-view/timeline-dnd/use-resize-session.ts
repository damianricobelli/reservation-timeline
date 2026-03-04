import dayjs from "dayjs";
import type { Dispatch, SetStateAction } from "react";
import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useState,
} from "react";
import type { ReservationTimelineRecord } from "@/core/types";
import { isReservationPreviewEqual } from "../domain/preview-equality";
import { getTimelineWindow } from "../domain/timeline-window";
import type { SelectionTable } from "../types";
import { getReservationEntityKey } from "../utils";
import { DATE_KEY_FORMAT } from "./constants";
import { buildResizePreview, getCommitReservationFromPreview } from "./preview";
import { commitReservationMove } from "./records";
import type {
  ActiveDragState,
  ActiveResizeState,
  ResizeHandleProps,
  TimelineDragPreview,
} from "./types";

type UseResizeSessionInput = {
  isDragActive: boolean;
  records: ReservationTimelineRecord[];
  setRecords: Dispatch<SetStateAction<ReservationTimelineRecord[]>>;
  tableById: Map<string, SelectionTable>;
  zoomPercent: number;
};

type UseResizeSessionResult = {
  getResizeHandleProps: (
    reservation: ActiveDragState["sourceReservation"],
    edge: ActiveResizeState["edge"],
  ) => ResizeHandleProps;
  getResizePreview: (
    reservation: ActiveDragState["sourceReservation"],
  ) => TimelineDragPreview | null;
};

export function useResizeSession({
  isDragActive,
  records,
  setRecords,
  tableById,
  zoomPercent,
}: UseResizeSessionInput): UseResizeSessionResult {
  const [activeResize, setActiveResize] = useState<ActiveResizeState | null>(
    null,
  );

  const clearResizeByPointer = useCallback((pointerId: number) => {
    setActiveResize((current) => {
      if (!current || current.pointerId !== pointerId) {
        return current;
      }

      return null;
    });
  }, []);

  const getResizeHandleProps = useCallback(
    (
      reservation: ActiveDragState["sourceReservation"],
      edge: ActiveResizeState["edge"],
    ): ResizeHandleProps => {
      const reservationEntityKey = getReservationEntityKey(reservation);

      const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();

        if (isDragActive) {
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

        const { timelineStart, timelineEnd } = getTimelineWindow(
          targetDateKey,
          targetRecord.restaurant.timezone,
        );
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

          if (isReservationPreviewEqual(current.preview, nextPreview)) {
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
        clearResizeByPointer(event.pointerId);

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      };

      const onLostPointerCapture = (
        event: ReactPointerEvent<HTMLDivElement>,
      ) => {
        clearResizeByPointer(event.pointerId);
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
      activeResize,
      clearResizeByPointer,
      isDragActive,
      records,
      setRecords,
      tableById,
      zoomPercent,
    ],
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
    getResizeHandleProps,
    getResizePreview,
  };
}
