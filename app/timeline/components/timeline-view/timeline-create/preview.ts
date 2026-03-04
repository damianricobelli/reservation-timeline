import dayjs, { type Dayjs } from "dayjs";
import {
  MIN_RESERVATION_MINUTES,
  SLOT_MINUTES,
  SLOT_WIDTH_PX,
  TOTAL_SLOTS,
} from "@/core/constants";
import type { DateKey, ReservationTimelineRecord, TableId } from "@/core/types";
import type { SelectionReservation, SelectionTable } from "../types";
import type { TimelineCreatePreview } from "./types";
import { getCreateValidationReason } from "./validation";

const CREATE_MAX_DURATION_MINUTES = 6 * 60;

export function buildCreatePreview({
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

export function getSnappedOffsetMinutes({
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

export function getEffectivePointerClientX({
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

export function buildReservationId() {
  const random =
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
      ? globalThis.crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `RES_${random.toUpperCase()}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
