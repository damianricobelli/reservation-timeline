import dayjs from "dayjs";
import {
  RESERVATION_INSET_X,
  RESERVATION_INSET_Y,
  ROW_HEIGHT_PX,
} from "@/core/constants";
import { cn } from "@/lib/utils";
import type { TimelineCreatePreview } from "./use-timeline-reservation-create";
import { getReservationBlockLayout, toZoomScaledX } from "./utils";

type TimelineCreatePreviewBlockProps = {
  preview: TimelineCreatePreview;
  validationMessage?: string;
};

/**
 * Dashed placeholder block used while dragging to create a reservation.
 */
export function TimelineCreatePreviewBlock({
  preview,
  validationMessage,
}: TimelineCreatePreviewBlockProps) {
  const reservationStart = dayjs(preview.reservation.startTime);
  const reservationEnd = dayjs(preview.reservation.endTime);
  const blockLayout = getReservationBlockLayout({
    reservationStart,
    reservationEnd,
    timelineStart: preview.timelineStart,
    timelineEnd: preview.timelineEnd,
    insetX: RESERVATION_INSET_X,
  });

  if (blockLayout.hidden) {
    return null;
  }

  const invalid = !preview.valid;
  const timeLabel = `${reservationStart.format("HH:mm")} - ${reservationEnd.format("HH:mm")}`;

  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute z-20 flex items-center justify-center rounded-xl border-2 border-dashed px-2",
          invalid
            ? "border-rose-500 bg-rose-50/70 text-rose-700"
            : "border-slate-700/75 bg-slate-50/85 text-slate-700",
        )}
        style={{
          left: toZoomScaledX(blockLayout.left),
          top: RESERVATION_INSET_Y,
          width: toZoomScaledX(blockLayout.width),
          height: ROW_HEIGHT_PX - RESERVATION_INSET_Y * 2,
        }}
      >
        <span className="truncate text-xs font-semibold tabular-nums">
          {timeLabel}
        </span>
      </div>

      {invalid && validationMessage ? (
        <div
          className="pointer-events-none absolute z-40 -translate-x-1/2 rounded-md border border-rose-400 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 shadow-sm"
          style={{
            left: toZoomScaledX(blockLayout.left + blockLayout.width / 2),
            top: ROW_HEIGHT_PX + 2,
          }}
        >
          {validationMessage}
        </div>
      ) : null}
    </>
  );
}
