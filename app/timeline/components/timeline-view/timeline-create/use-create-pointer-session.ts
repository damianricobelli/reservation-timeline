import { type RefObject, useCallback, useRef, useState } from "react";
import type { DateKey, ReservationTimelineRecord, TableId } from "@/core/types";
import type { SelectionTable } from "../types";
import { buildCreatePreview, getEffectivePointerClientX } from "./preview";
import { buildRowCreatePointerHandlers } from "./row-create-pointer-handlers";
import type {
  ActiveCreateState,
  RowCreatePointerHandlers,
  TimelineCreateCommitDraft,
  TimelineCreatePreview,
} from "./types";

type UseCreatePointerSessionInput = {
  records: ReservationTimelineRecord[];
  zoomPercent: number;
  rightViewportRef: RefObject<HTMLDivElement | null>;
  queueOpenDraft: (draft: TimelineCreateCommitDraft) => void;
};

type UseCreatePointerSessionResult = {
  getRowCreatePointerHandlers: (input: {
    dateKey: DateKey;
    table: SelectionTable;
  }) => RowCreatePointerHandlers;
  getRowCreatePreview: (
    dateKey: DateKey,
    tableId: TableId,
  ) => TimelineCreatePreview | null;
};

export function useCreatePointerSession({
  records,
  zoomPercent,
  rightViewportRef,
  queueOpenDraft,
}: UseCreatePointerSessionInput): UseCreatePointerSessionResult {
  const [activeCreate, setActiveCreateState] =
    useState<ActiveCreateState | null>(null);
  const activeCreateRef = useRef<ActiveCreateState | null>(null);
  const autoScrollDirectionRef = useRef<-1 | 0 | 1>(0);
  const autoScrollRafRef = useRef<number | null>(null);

  const updateActiveCreate = useCallback(
    (
      nextOrUpdater:
        | ActiveCreateState
        | null
        | ((current: ActiveCreateState | null) => ActiveCreateState | null),
    ) => {
      const current = activeCreateRef.current;
      const next =
        typeof nextOrUpdater === "function"
          ? (
              nextOrUpdater as (
                current: ActiveCreateState | null,
              ) => ActiveCreateState | null
            )(current)
          : nextOrUpdater;
      activeCreateRef.current = next;
      setActiveCreateState(next);
      return next;
    },
    [],
  );

  const stopAutoScroll = useCallback(() => {
    autoScrollDirectionRef.current = 0;

    if (autoScrollRafRef.current !== null) {
      cancelAnimationFrame(autoScrollRafRef.current);
      autoScrollRafRef.current = null;
    }
  }, []);

  const clearActiveCreateByPointerId = useCallback(
    (pointerId: number) => {
      updateActiveCreate((current) => {
        if (!current || current.pointerId !== pointerId) {
          return current;
        }

        return null;
      });
    },
    [updateActiveCreate],
  );

  const buildPreviewFromState = useCallback(
    (state: ActiveCreateState, rawPointerClientX: number) => {
      const effectiveClientX = getEffectivePointerClientX({
        rawPointerClientX,
        originScrollLeft: state.originScrollLeft,
        viewport: rightViewportRef.current,
      });

      return buildCreatePreview({
        originClientX: state.originClientX,
        nextClientX: effectiveClientX,
        sourceOffsetMinutes: state.sourceOffsetMinutes,
        dateKey: state.dateKey,
        table: state.table,
        targetRecord: state.targetRecord,
        timelineStart: state.timelineStart,
        timelineEnd: state.timelineEnd,
        zoomPercent,
      });
    },
    [rightViewportRef, zoomPercent],
  );

  const getRowCreatePointerHandlers = useCallback(
    ({ dateKey, table }: { dateKey: DateKey; table: SelectionTable }) => {
      return buildRowCreatePointerHandlers({
        dateKey,
        table,
        records,
        zoomPercent,
        rightViewportRef,
        stopAutoScroll,
        updateActiveCreate,
        activeCreateRef,
        autoScrollDirectionRef,
        autoScrollRafRef,
        buildPreviewFromState,
        queueOpenDraft,
        clearActiveCreateByPointerId,
      });
    },
    [
      buildPreviewFromState,
      clearActiveCreateByPointerId,
      queueOpenDraft,
      records,
      rightViewportRef,
      stopAutoScroll,
      updateActiveCreate,
      zoomPercent,
    ],
  );

  const getRowCreatePreview = useCallback(
    (dateKey: DateKey, tableId: TableId): TimelineCreatePreview | null => {
      if (!activeCreate) {
        return null;
      }

      if (
        activeCreate.dateKey !== dateKey ||
        activeCreate.table.id !== tableId
      ) {
        return null;
      }

      return activeCreate.preview;
    },
    [activeCreate],
  );

  return {
    getRowCreatePointerHandlers,
    getRowCreatePreview,
  };
}
