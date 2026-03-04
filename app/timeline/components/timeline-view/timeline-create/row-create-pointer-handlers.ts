import type { PointerEvent as ReactPointerEvent, RefObject } from "react";
import type { DateKey, ReservationTimelineRecord } from "@/core/types";
import { isCreatePreviewEqual } from "../domain/preview-equality";
import { getTimelineWindow } from "../domain/timeline-window";
import type { SelectionTable } from "../types";
import { buildCreatePreview, getSnappedOffsetMinutes } from "./preview";
import type {
  ActiveCreateState,
  RowCreatePointerHandlers,
  TimelineCreateCommitDraft,
  TimelineCreatePreview,
} from "./types";

const AUTO_SCROLL_EDGE_THRESHOLD_PX = 48;
const AUTO_SCROLL_STEP_PX = 12;

type BuildRowCreatePointerHandlersInput = {
  dateKey: DateKey;
  table: SelectionTable;
  records: ReservationTimelineRecord[];
  zoomPercent: number;
  rightViewportRef: RefObject<HTMLDivElement | null>;
  stopAutoScroll: () => void;
  updateActiveCreate: (
    nextOrUpdater:
      | ActiveCreateState
      | null
      | ((current: ActiveCreateState | null) => ActiveCreateState | null),
  ) => ActiveCreateState | null;
  activeCreateRef: RefObject<ActiveCreateState | null>;
  autoScrollDirectionRef: RefObject<-1 | 0 | 1>;
  autoScrollRafRef: RefObject<number | null>;
  buildPreviewFromState: (
    state: ActiveCreateState,
    rawPointerClientX: number,
  ) => TimelineCreatePreview;
  queueOpenDraft: (draft: TimelineCreateCommitDraft) => void;
  clearActiveCreateByPointerId: (pointerId: number) => void;
};

export function buildRowCreatePointerHandlers({
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
}: BuildRowCreatePointerHandlersInput): RowCreatePointerHandlers {
  const startAutoScrollLoop = () => {
    if (autoScrollRafRef.current !== null) {
      return;
    }

    const tick = () => {
      const viewport = rightViewportRef.current;
      const direction = autoScrollDirectionRef.current;

      if (!viewport || direction === 0) {
        autoScrollRafRef.current = null;
        return;
      }

      const maxScrollLeft = Math.max(
        0,
        viewport.scrollWidth - viewport.clientWidth,
      );

      if (maxScrollLeft <= 0) {
        stopAutoScroll();
        return;
      }

      const previousScrollLeft = viewport.scrollLeft;
      const nextScrollLeft = clamp(
        previousScrollLeft + direction * AUTO_SCROLL_STEP_PX,
        0,
        maxScrollLeft,
      );

      if (nextScrollLeft === previousScrollLeft) {
        stopAutoScroll();
        return;
      }

      viewport.scrollLeft = nextScrollLeft;

      updateActiveCreate((current) => {
        if (
          !current ||
          current.dateKey !== dateKey ||
          current.table.id !== table.id
        ) {
          return current;
        }

        const nextPreview = buildPreviewFromState(
          current,
          current.pointerClientX,
        );

        if (isCreatePreviewEqual(current.preview, nextPreview)) {
          return current;
        }

        return {
          ...current,
          preview: nextPreview,
        };
      });

      autoScrollRafRef.current = requestAnimationFrame(tick);
    };

    autoScrollRafRef.current = requestAnimationFrame(tick);
  };

  const updateAutoScrollDirection = (pointerClientX: number) => {
    const viewport = rightViewportRef.current;

    if (!viewport) {
      stopAutoScroll();
      return;
    }

    const rect = viewport.getBoundingClientRect();
    const nearLeftEdge =
      pointerClientX <= rect.left + AUTO_SCROLL_EDGE_THRESHOLD_PX;
    const nearRightEdge =
      pointerClientX >= rect.right - AUTO_SCROLL_EDGE_THRESHOLD_PX;
    const direction: -1 | 0 | 1 = nearRightEdge ? 1 : nearLeftEdge ? -1 : 0;

    if (direction === autoScrollDirectionRef.current) {
      return;
    }

    autoScrollDirectionRef.current = direction;

    if (direction === 0) {
      if (autoScrollRafRef.current !== null) {
        cancelAnimationFrame(autoScrollRafRef.current);
        autoScrollRafRef.current = null;
      }
      return;
    }

    startAutoScrollLoop();
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !event.isPrimary) {
      return;
    }

    const eventTarget = event.target;
    if (!(eventTarget instanceof Element)) {
      return;
    }
    if (eventTarget.closest('[data-reservation-block="true"]')) {
      return;
    }

    stopAutoScroll();

    const targetRecord = records.find((record) => record.date === dateKey);
    if (!targetRecord) {
      return;
    }

    const { timelineStart, timelineEnd } = getTimelineWindow(
      dateKey,
      targetRecord.restaurant.timezone,
    );
    const sourceOffsetMinutes = getSnappedOffsetMinutes({
      clientX: event.clientX,
      rowElement: event.currentTarget,
      zoomPercent,
    });
    const preview = buildCreatePreview({
      originClientX: event.clientX,
      nextClientX: event.clientX,
      sourceOffsetMinutes,
      dateKey,
      table,
      targetRecord,
      timelineStart,
      timelineEnd,
      zoomPercent,
    });

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    updateAutoScrollDirection(event.clientX);

    updateActiveCreate({
      pointerId: event.pointerId,
      originClientX: event.clientX,
      originScrollLeft: rightViewportRef.current?.scrollLeft ?? 0,
      pointerClientX: event.clientX,
      sourceOffsetMinutes,
      dateKey,
      table,
      targetRecord,
      timelineStart,
      timelineEnd,
      preview,
    });
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    updateAutoScrollDirection(event.clientX);

    updateActiveCreate((current) => {
      if (
        !current ||
        current.pointerId !== event.pointerId ||
        current.dateKey !== dateKey ||
        current.table.id !== table.id
      ) {
        return current;
      }

      const preview = buildPreviewFromState(current, event.clientX);

      if (
        isCreatePreviewEqual(current.preview, preview) &&
        current.pointerClientX === event.clientX
      ) {
        return current;
      }

      return {
        ...current,
        pointerClientX: event.clientX,
        preview,
      };
    });
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    stopAutoScroll();

    const current = activeCreateRef.current;
    const canHandlePointerUp = Boolean(
      current &&
        current.pointerId === event.pointerId &&
        current.dateKey === dateKey &&
        current.table.id === table.id,
    );
    const draftToOpen =
      canHandlePointerUp && current && current.preview.valid
        ? {
            dateKey: current.dateKey,
            table: current.table,
            targetRecord: current.targetRecord,
            reservation: current.preview.reservation,
          }
        : null;

    updateActiveCreate(null);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (draftToOpen) {
      queueOpenDraft(draftToOpen);
    }
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    stopAutoScroll();
    clearActiveCreateByPointerId(event.pointerId);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const onLostPointerCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    stopAutoScroll();
    clearActiveCreateByPointerId(event.pointerId);
  };

  return {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onLostPointerCapture,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
