import type { ReservationStatus } from "@/core/types";

// Times and slots
export const SLOT_MINUTES = 15;
export const DEFAULT_RESERVATION_MINUTES = 90;

export const MIN_RESERVATION_MINUTES = 30;
export const MAX_RESERVATION_MINUTES = 240;

export const TIMELINE_START_HOUR = 11;
export const TIMELINE_END_HOUR = 24;
export const TIMELINE_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR;

// Grid/Layout
export const TABLE_COL = 128;
export const MIN_DURATION_MIN = SLOT_MINUTES;
export const MAX_DURATION_MIN = 8 * 60;
export const ZOOM_STEPS = [50, 75, 100, 125, 150] as const;
export const DEFAULT_ZOOM_PERCENT = 100;
export const BASE_CELL_WIDTH = 60;
export const BLOCK_PADDING = 3;

export const DEFAULT_TIMELINE_COUNT = 50;

// Timeline UI
export const SLOT_WIDTH_PX = BASE_CELL_WIDTH;
export const ROW_HEIGHT_PX = 60;
export const TABLE_LABEL_COL_PX = 220;
export const HEADER_HEIGHT_PX = 56;
export const RESERVATION_INSET_X = BLOCK_PADDING;
export const RESERVATION_INSET_Y = 4;

export const TIMELINE_DURATION_MINUTES =
  (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * 60;
export const TOTAL_SLOTS = TIMELINE_DURATION_MINUTES / SLOT_MINUTES;
export const GRID_WIDTH_CSS = `calc(var(--timeline-slot-width) * ${TOTAL_SLOTS})`;

export type ReservationBlockStyle = {
  blockClassName: string;
  accentClassName: string;
  metaClassName: string;
  statusBadgeClassName: string;
  priorityBadgeClassName: string;
};

export const STATUS_BLOCK_STYLE: Record<
  ReservationStatus,
  ReservationBlockStyle
> = {
  PENDING: {
    blockClassName:
      "border-status-pending/45 bg-status-pending/24 text-amber-950",
    accentClassName: "bg-status-pending",
    metaClassName: "text-amber-900/85",
    statusBadgeClassName:
      "border-status-pending/40 bg-status-pending/20 text-amber-900",
    priorityBadgeClassName:
      "border-status-pending/40 bg-status-pending/18 text-amber-900",
  },
  CONFIRMED: {
    blockClassName:
      "border-status-confirmed/40 bg-status-confirmed/18 text-blue-950",
    accentClassName: "bg-status-confirmed",
    metaClassName: "text-blue-900/80",
    statusBadgeClassName:
      "border-status-confirmed/45 bg-status-confirmed/18 text-blue-900",
    priorityBadgeClassName:
      "border-status-confirmed/45 bg-status-confirmed/14 text-blue-900",
  },
  SEATED: {
    blockClassName:
      "border-status-seated/45 bg-status-seated/20 text-emerald-950",
    accentClassName: "bg-status-seated",
    metaClassName: "text-emerald-900/80",
    statusBadgeClassName:
      "border-status-seated/45 bg-status-seated/18 text-emerald-900",
    priorityBadgeClassName:
      "border-status-seated/45 bg-status-seated/14 text-emerald-900",
  },
  FINISHED: {
    blockClassName:
      "border-status-finished/50 bg-status-finished/24 text-slate-900",
    accentClassName: "bg-status-finished",
    metaClassName: "text-slate-700/85",
    statusBadgeClassName:
      "border-status-finished/50 bg-status-finished/20 text-slate-800",
    priorityBadgeClassName:
      "border-status-finished/55 bg-status-finished/18 text-slate-800",
  },
  NO_SHOW: {
    blockClassName:
      "border-status-no-show/45 bg-status-no-show/18 text-rose-950",
    accentClassName: "bg-status-no-show",
    metaClassName: "text-rose-900/85",
    statusBadgeClassName:
      "border-status-no-show/45 bg-status-no-show/16 text-rose-900",
    priorityBadgeClassName:
      "border-status-no-show/45 bg-status-no-show/14 text-rose-900",
  },
  CANCELLED: {
    blockClassName:
      "border-status-cancelled/55 bg-status-cancelled/22 text-slate-800",
    accentClassName: "bg-status-cancelled",
    metaClassName: "text-slate-700/85",
    statusBadgeClassName:
      "border-status-cancelled/60 bg-status-cancelled/18 text-slate-800",
    priorityBadgeClassName:
      "border-status-cancelled/60 bg-status-cancelled/16 text-slate-800",
  },
};
