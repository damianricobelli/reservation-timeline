import dayjs, { type Dayjs } from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type SetStateAction,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MIN_RESERVATION_MINUTES,
  SLOT_MINUTES,
  SLOT_WIDTH_PX,
  TIMELINE_DURATION_MINUTES,
  TIMELINE_START_HOUR,
  TOTAL_SLOTS,
} from "@/core/constants";
import type { DateKey, ReservationTimelineRecord, TableId } from "@/core/types";
import {
  getCreateValidationMessage,
  type TimelineCreateValidationReason,
} from "./timeline-create-validation-message";
import { appendReservation } from "./timeline-dnd/records";
import { getMoveValidationReason } from "./timeline-dnd/validation";
import type { SelectionReservation, SelectionTable } from "./types";

dayjs.extend(utc);
dayjs.extend(timezone);

const CREATE_MAX_DURATION_MINUTES = 6 * 60;
const CREATE_RESERVATION_ENTITY_KEY = "__timeline-create__";
const AUTO_SCROLL_EDGE_THRESHOLD_PX = 48;
const AUTO_SCROLL_STEP_PX = 12;

type TimelineCreateCommitDraft = {
  dateKey: DateKey;
  table: SelectionTable;
  targetRecord: ReservationTimelineRecord;
  reservation: SelectionReservation;
};

type ActiveCreateState = {
  dateKey: DateKey;
  table: SelectionTable;
  targetRecord: ReservationTimelineRecord;
  timelineStart: Dayjs;
  timelineEnd: Dayjs;
  pointerId: number;
  originClientX: number;
  originScrollLeft: number;
  pointerClientX: number;
  sourceOffsetMinutes: number;
  preview: TimelineCreatePreview;
};

export type TimelineCreateDraft = {
  dateKey: DateKey;
  table: SelectionTable;
  reservation: SelectionReservation;
};

export type TimelineCreatePreview = {
  reservation: SelectionReservation;
  timelineStart: Dayjs;
  timelineEnd: Dayjs;
  dateKey: DateKey;
  table: SelectionTable;
  valid: boolean;
  reason?: TimelineCreateValidationReason;
};

export type TimelineQuickCreateSubmitInput = {
  customerName: string;
  phone: string;
  partySize: number;
  status: SelectionReservation["status"];
  priority: SelectionReservation["priority"];
  notes?: string;
};

export type TimelineQuickCreateSubmitResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason?: TimelineCreateValidationReason;
      message: string;
    };

export type RowCreatePointerHandlers = {
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onLostPointerCapture: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

type GetRowCreatePointerHandlersInput = {
  dateKey: DateKey;
  table: SelectionTable;
};

type UseTimelineReservationCreateInput = {
  records: ReservationTimelineRecord[];
  setRecords: Dispatch<SetStateAction<ReservationTimelineRecord[]>>;
  zoomPercent: number;
  rightViewportRef: RefObject<HTMLDivElement | null>;
};

export type TimelineReservationCreateApi = {
  getRowCreatePointerHandlers: (
    input: GetRowCreatePointerHandlersInput,
  ) => RowCreatePointerHandlers;
  getRowCreatePreview: (
    dateKey: DateKey,
    tableId: TableId,
  ) => TimelineCreatePreview | null;
  draft: TimelineCreateDraft | null;
  closeDraft: () => void;
  submitDraft: (
    input: TimelineQuickCreateSubmitInput,
  ) => TimelineQuickCreateSubmitResult;
};

/**
 * Encapsulates click-and-drag creation of reservations on empty timeline rows.
 *
 * Features:
 * - Pointer-based block drawing on empty grid space.
 * - 15-minute snapping while dragging to the right.
 * - Real-time validation against overlap, service hours, and timeline bounds.
 * - Horizontal auto-scroll while drawing near viewport edges.
 * - Draft commit only when form data and business constraints are valid.
 */
export function useTimelineReservationCreate({
  records,
  setRecords,
  zoomPercent,
  rightViewportRef,
}: UseTimelineReservationCreateInput): TimelineReservationCreateApi {
  const [activeCreate, setActiveCreateState] =
    useState<ActiveCreateState | null>(null);
  const activeCreateRef = useRef<ActiveCreateState | null>(null);
  const [draftState, setDraftState] =
    useState<TimelineCreateCommitDraft | null>(null);
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

  const closeDraft = useCallback(() => {
    setDraftState(null);
  }, []);

  /**
   * Defers draft opening so the same pointer interaction cannot instantly close it.
   */
  const queueOpenDraft = useCallback((draft: TimelineCreateCommitDraft) => {
    setTimeout(() => {
      setDraftState(draft);
    }, 0);
  }, []);

  const submitDraft = useCallback(
    (
      input: TimelineQuickCreateSubmitInput,
    ): TimelineQuickCreateSubmitResult => {
      if (!draftState) {
        return {
          ok: false,
          message: "Unable to create reservation: no active draft.",
        };
      }

      const customerName = input.customerName.trim();
      const phone = input.phone.trim();
      const notes = input.notes?.trim();
      const partySize = input.partySize;
      const durationMinutes = draftState.reservation.durationMinutes;

      if (!customerName || !phone) {
        return {
          ok: false,
          message: "Customer name and phone are required.",
        };
      }

      if (
        durationMinutes < MIN_RESERVATION_MINUTES ||
        durationMinutes > CREATE_MAX_DURATION_MINUTES ||
        durationMinutes % SLOT_MINUTES !== 0
      ) {
        return {
          ok: false,
          message:
            "Duration must be between 30 and 360 minutes in 15-minute slots.",
        };
      }

      const targetRecord =
        records.find((record) => record.date === draftState.dateKey) ??
        draftState.targetRecord;
      const startTime = dayjs(draftState.reservation.startTime);
      const endTime = startTime.add(durationMinutes, "minute");
      const candidate: SelectionReservation = {
        ...draftState.reservation,
        customer: {
          name: customerName,
          phone,
        },
        partySize,
        durationMinutes,
        startTime: startTime.format(),
        endTime: endTime.format(),
        status: input.status,
        priority: input.priority,
        notes: notes || undefined,
      };
      const reason = getCreateValidationReason({
        candidate,
        targetDateKey: draftState.dateKey,
        targetTable: draftState.table,
        targetRecord,
      });

      if (reason) {
        return {
          ok: false,
          reason,
          message:
            getCreateValidationMessage(reason) ??
            "Cannot create reservation with current values.",
        };
      }

      const nowIso = dayjs().format();
      const committedReservation: SelectionReservation = {
        ...candidate,
        id: buildReservationId(),
        createdAt: nowIso,
        updatedAt: nowIso,
        source: "walkin",
      };

      setRecords((previous) =>
        appendReservation(previous, draftState.dateKey, committedReservation),
      );
      closeDraft();
      return { ok: true };
    },
    [closeDraft, draftState, records, setRecords],
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

  /**
   * Returns pointer handlers for one table row create surface.
   *
   * Lifecycle:
   * - `pointerdown` on empty row captures pointer and initializes preview.
   * - `pointermove` updates slot-snapped duration preview.
   * - `pointerup` stores draft only when preview is valid.
   */
  const getRowCreatePointerHandlers = useCallback(
    ({
      dateKey,
      table,
    }: GetRowCreatePointerHandlersInput): RowCreatePointerHandlers => {
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

        const timelineStart = getTimelineStartForDate({
          dateKey,
          timezoneName: targetRecord.restaurant.timezone,
        });
        const timelineEnd = timelineStart.add(
          TIMELINE_DURATION_MINUTES,
          "minute",
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
          const previewUnchanged =
            current.preview.reservation.startTime ===
              preview.reservation.startTime &&
            current.preview.reservation.endTime ===
              preview.reservation.endTime &&
            current.preview.valid === preview.valid &&
            current.preview.reason === preview.reason;

          if (previewUnchanged && current.pointerClientX === event.clientX) {
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

        updateActiveCreate((current) => {
          if (!current || current.pointerId !== event.pointerId) {
            return current;
          }

          return null;
        });

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          event.currentTarget.releasePointerCapture(event.pointerId);
        }
      };

      const onLostPointerCapture = (
        event: ReactPointerEvent<HTMLDivElement>,
      ) => {
        stopAutoScroll();

        updateActiveCreate((current) => {
          if (!current || current.pointerId !== event.pointerId) {
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
      buildPreviewFromState,
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

  const draft = useMemo<TimelineCreateDraft | null>(() => {
    if (!draftState) {
      return null;
    }

    return {
      dateKey: draftState.dateKey,
      table: draftState.table,
      reservation: draftState.reservation,
    };
  }, [draftState]);

  return {
    getRowCreatePointerHandlers,
    getRowCreatePreview,
    draft,
    closeDraft,
    submitDraft,
  };
}

/**
 * Computes a preview candidate using slot-snapped horizontal pointer movement.
 */
function buildCreatePreview({
  originClientX,
  nextClientX,
  sourceOffsetMinutes,
  dateKey,
  table,
  targetRecord,
  timelineStart,
  timelineEnd,
  zoomPercent,
}: {
  originClientX: number;
  nextClientX: number;
  sourceOffsetMinutes: number;
  dateKey: DateKey;
  table: SelectionTable;
  targetRecord: ReservationTimelineRecord;
  timelineStart: Dayjs;
  timelineEnd: Dayjs;
  zoomPercent: number;
}): TimelineCreatePreview {
  const zoomScaledSlotWidth = SLOT_WIDTH_PX * (zoomPercent / 100);
  const deltaSlots =
    zoomScaledSlotWidth > 0
      ? Math.round((nextClientX - originClientX) / zoomScaledSlotWidth)
      : 0;
  const minDurationSlots = Math.ceil(MIN_RESERVATION_MINUTES / SLOT_MINUTES);
  const maxDurationSlots = Math.floor(
    CREATE_MAX_DURATION_MINUTES / SLOT_MINUTES,
  );
  const durationSlots = clamp(
    minDurationSlots + deltaSlots,
    minDurationSlots,
    maxDurationSlots,
  );
  const durationMinutes = clamp(
    durationSlots * SLOT_MINUTES,
    MIN_RESERVATION_MINUTES,
    CREATE_MAX_DURATION_MINUTES,
  );
  const start = timelineStart.add(sourceOffsetMinutes, "minute");
  const end = start.add(durationMinutes, "minute");
  const previewReservation = buildPreviewReservation({
    tableId: table.id,
    partySize: table.capacity.min,
    start,
    end,
    durationMinutes,
  });
  const reason = getCreateValidationReason({
    candidate: previewReservation,
    targetDateKey: dateKey,
    targetTable: table,
    targetRecord,
  });

  return {
    reservation: previewReservation,
    timelineStart,
    timelineEnd,
    dateKey,
    table,
    valid: !reason,
    reason,
  };
}

/**
 * Applies duration and placement constraints for creation flow.
 */
function getCreateValidationReason({
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

  return getMoveValidationReason({
    candidate,
    targetDateKey,
    targetTable,
    targetRecord,
    sourceReservationEntityKey: CREATE_RESERVATION_ENTITY_KEY,
  });
}

function buildPreviewReservation({
  tableId,
  partySize,
  start,
  end,
  durationMinutes,
}: {
  tableId: TableId;
  partySize: number;
  start: Dayjs;
  end: Dayjs;
  durationMinutes: number;
}): SelectionReservation {
  const nowIso = dayjs().format();

  return {
    id: "__timeline-create-preview__",
    tableId,
    customer: {
      name: "New reservation",
      phone: "",
    },
    partySize,
    startTime: start.format(),
    endTime: end.format(),
    durationMinutes,
    status: "CONFIRMED",
    priority: "STANDARD",
    source: "walkin",
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function getTimelineStartForDate({
  dateKey,
  timezoneName,
}: {
  dateKey: DateKey;
  timezoneName: string;
}) {
  return dayjs
    .tz(dateKey, timezoneName)
    .hour(TIMELINE_START_HOUR)
    .minute(0)
    .second(0)
    .millisecond(0);
}

function getSnappedOffsetMinutes({
  clientX,
  rowElement,
  zoomPercent,
}: {
  clientX: number;
  rowElement: HTMLDivElement;
  zoomPercent: number;
}) {
  const rect = rowElement.getBoundingClientRect();
  const localX = clientX - rect.left;
  const zoomScaledSlotWidth = SLOT_WIDTH_PX * (zoomPercent / 100);
  const rawSlotIndex =
    zoomScaledSlotWidth > 0 ? Math.floor(localX / zoomScaledSlotWidth) : 0;
  const slotIndex = clamp(rawSlotIndex, 0, Math.max(0, TOTAL_SLOTS - 1));

  return slotIndex * SLOT_MINUTES;
}

function getEffectivePointerClientX({
  rawPointerClientX,
  originScrollLeft,
  viewport,
}: {
  rawPointerClientX: number;
  originScrollLeft: number;
  viewport: HTMLDivElement | null;
}) {
  const currentScrollLeft = viewport?.scrollLeft ?? originScrollLeft;
  return rawPointerClientX + (currentScrollLeft - originScrollLeft);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildReservationId() {
  const random =
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
      ? globalThis.crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `RES_${random.toUpperCase()}`;
}
