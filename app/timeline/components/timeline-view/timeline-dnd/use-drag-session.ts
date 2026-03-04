import dayjs from "dayjs";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";
import type { ReservationTimelineRecord } from "@/core/types";
import {
  isReservationPreviewEqual,
  isRowTargetEqual,
} from "../domain/preview-equality";
import { getTimelineWindow } from "../domain/timeline-window";
import type { SelectionTable } from "../types";
import { DATE_KEY_FORMAT } from "./constants";
import {
  isReservationDraggableData,
  isRowDroppableData,
} from "./ids-and-guards";
import { buildDragPreview } from "./preview";
import { commitReservationMove, findReservationByEntityKey } from "./records";
import type {
  ActiveDragState,
  ProviderHandlers,
  RowTarget,
  TimelineDragOperation,
  TimelineDragPreview,
} from "./types";

type UseDragSessionInput = {
  records: ReservationTimelineRecord[];
  setRecords: Dispatch<SetStateAction<ReservationTimelineRecord[]>>;
  tableById: Map<string, SelectionTable>;
  zoomPercent: number;
};

export function useDragSession({
  records,
  setRecords,
  tableById,
  zoomPercent,
}: UseDragSessionInput): {
  providerHandlers: ProviderHandlers;
  preview: TimelineDragPreview | null;
  isDragActive: boolean;
} {
  const [activeDrag, setActiveDrag] = useState<ActiveDragState | null>(null);

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

        if (
          isReservationPreviewEqual(current.preview, nextPreview) &&
          isRowTargetEqual(current.target, target)
        ) {
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
      const sourceRecord = records.find(
        (record) => record.date === sourceDateKey,
      );
      const sourceTimezone = sourceRecord?.restaurant.timezone ?? "UTC";
      const sourceTimelineStart = getTimelineWindow(
        sourceDateKey,
        sourceTimezone,
      ).timelineStart;
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
      onDragMove: (event) => {
        updatePreviewFromOperation(event.operation);
      },
      onDragOver: (event) => {
        updatePreviewFromOperation(event.operation);
      },
      onDragEnd: handleDragEnd,
    }),
    [handleDragEnd, handleDragStart, updatePreviewFromOperation],
  );

  return {
    providerHandlers,
    preview: activeDrag?.preview ?? null,
    isDragActive: activeDrag !== null,
  };
}
