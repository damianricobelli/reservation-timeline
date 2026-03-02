import dayjs, { type Dayjs } from "dayjs";
import { Clock3Icon, UsersIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RESERVATION_INSET_X,
  RESERVATION_INSET_Y,
  ROW_HEIGHT_PX,
  STATUS_BLOCK_STYLE,
} from "@/core/constants";
import { cn } from "@/lib/utils";
import type {
  SelectionReservation,
  SelectionSector,
  SelectionTable,
} from "./types";
import {
  formatPriorityLabel,
  formatTimeRange,
  getReservationBlockLayout,
  getReservationRenderKey,
  getStatusLabel,
  toZoomScaledX,
} from "./utils";

type TimelineReservationBlockProps = {
  reservation: SelectionReservation;
  rowTable: SelectionTable;
  rowSector: SelectionSector;
  timelineStart: Dayjs;
  timelineEnd: Dayjs;
  isSelected: boolean;
  onClick: (reservationKey: string) => void;
  tableById: Map<string, SelectionTable>;
  sectorById: Map<string, SelectionSector>;
};

export function TimelineReservationBlock({
  reservation,
  rowTable,
  rowSector,
  timelineStart,
  timelineEnd,
  isSelected,
  onClick,
  tableById,
  sectorById,
}: TimelineReservationBlockProps) {
  const reservationStart = dayjs(reservation.startTime);
  const reservationEnd = dayjs(reservation.endTime);
  const blockLayout = getReservationBlockLayout({
    reservationStart,
    reservationEnd,
    timelineStart,
    timelineEnd,
    insetX: RESERVATION_INSET_X,
  });

  if (blockLayout.hidden) {
    return null;
  }

  const reservationKey = getReservationRenderKey(reservation);
  const statusStyle = STATUS_BLOCK_STYLE[reservation.status];
  const statusLabel = getStatusLabel(reservation.status);
  const priorityLabel = formatPriorityLabel(reservation.priority);
  const reservationTable = tableById.get(reservation.tableId);
  const reservationSector = sectorById.get(reservationTable?.sectorId ?? "");

  return (
    <Tooltip key={reservationKey}>
      <TooltipTrigger
        type="button"
        data-reservation-block="true"
        data-selected={isSelected}
        className={cn(
          "absolute z-10 overflow-hidden rounded-lg border text-left transition",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950/30",
          "data-selected:outline-none data-selected:ring-1 data-selected:ring-slate-950",
          reservation.status === "CANCELLED" && "timeline-cancelled-stripes",
          statusStyle.blockClassName,
        )}
        style={{
          left: toZoomScaledX(blockLayout.left),
          top: RESERVATION_INSET_Y,
          width: toZoomScaledX(blockLayout.width),
          height: ROW_HEIGHT_PX - RESERVATION_INSET_Y * 2,
        }}
        onClick={() => onClick(reservationKey)}
        aria-pressed={isSelected}
        aria-selected={isSelected}
      >
        <div className="relative flex h-full w-full flex-col justify-center gap-0.5 pl-3.5 pr-2">
          <span
            className={cn(
              "pointer-events-none absolute inset-y-1.5 left-1.5 w-1 rounded-full",
              statusStyle.accentClassName,
            )}
          />

          <div className="flex items-center justify-between gap-1.5">
            <p className="truncate text-xs font-semibold leading-tight">
              {reservation.customer.name}
            </p>

            <span className="inline-flex shrink-0 items-center gap-1">
              <Badge
                variant="outline"
                className={cn(
                  "h-4 rounded-md px-1 text-[9px] font-semibold uppercase tracking-wide",
                  statusStyle.statusBadgeClassName,
                )}
              >
                {statusLabel}
              </Badge>

              {priorityLabel ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "h-4 rounded-md px-1 text-[9px] font-semibold tracking-wide",
                    statusStyle.priorityBadgeClassName,
                  )}
                >
                  {priorityLabel}
                </Badge>
              ) : null}
            </span>
          </div>

          <div
            className={cn(
              "flex items-center gap-2 text-[11px] leading-none tabular-nums",
              statusStyle.metaClassName,
            )}
          >
            <span className="inline-flex items-center gap-1 truncate">
              <UsersIcon className="size-3 shrink-0" />
              {reservation.partySize}
            </span>

            <span className="inline-flex items-center gap-1 truncate">
              <Clock3Icon className="size-3 shrink-0" />
              {formatTimeRange(reservation)}
            </span>
          </div>
        </div>
      </TooltipTrigger>

      <TooltipContent>
        <div className="flex items-start justify-between gap-2 border-b border-slate-200 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {reservation.customer.name}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {reservationTable?.name ?? rowTable.name} ·{" "}
              {reservationSector?.name ?? rowSector.name}
            </p>
          </div>

          <Badge
            variant="outline"
            className={cn(
              "shrink-0 rounded-md px-1.5 text-[9px] font-semibold uppercase tracking-wide",
              statusStyle.statusBadgeClassName,
            )}
          >
            {statusLabel}
          </Badge>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-1 px-3 py-2 text-[11px]">
          <dt className="text-slate-500">Time</dt>
          <dd className="font-medium tabular-nums text-slate-800">
            {formatTimeRange(reservation)}
          </dd>

          <dt className="text-slate-500">Party</dt>
          <dd className="font-medium text-slate-800">
            {reservation.partySize}
          </dd>

          <dt className="text-slate-500">Priority</dt>
          <dd className="font-medium text-slate-800">
            {priorityLabel ?? "Standard"}
          </dd>

          <dt className="text-slate-500">Phone</dt>
          <dd className="font-medium text-slate-800">
            {reservation.customer.phone}
          </dd>
        </dl>

        {reservation.notes ? (
          <div className="border-t border-slate-200 px-3 py-2">
            <p className="text-[11px] text-slate-500">Notes</p>
            <p className="mt-0.5 text-[11px] text-slate-700">
              {reservation.notes}
            </p>
          </div>
        ) : null}

        {reservation.status === "CANCELLED" ? (
          <div className="border-t border-slate-200 px-3 py-1.5 text-[10px] text-slate-500">
            Cancelled reservation
          </div>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}
