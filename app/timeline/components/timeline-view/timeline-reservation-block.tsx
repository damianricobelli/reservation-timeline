import { useDraggable } from "@dnd-kit/react";
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
  SelectionSectorId,
  SelectionTable,
  SelectionTableId,
} from "./types";
import type {
  ReservationDraggableData,
  ResizeHandleProps,
} from "./use-timeline-reservation-dnd";
import {
  formatPriorityLabel,
  formatTimeRange,
  getReservationBlockLayout,
  getStatusLabel,
  toZoomScaledX,
} from "./utils";

type TimelineReservationBlockProps = {
  reservation: SelectionReservation;
  reservationKey: string;
  rowTable: SelectionTable;
  rowSector: SelectionSector;
  timelineStart: Dayjs;
  timelineEnd: Dayjs;
  isSelected: boolean;
  onClick: (reservationKey: string) => void;
  tableById: Map<SelectionTableId, SelectionTable>;
  sectorById: Map<SelectionSectorId, SelectionSector>;
  dragId: string;
  dragData: ReservationDraggableData;
  resizeStartHandleProps: ResizeHandleProps;
  resizeEndHandleProps: ResizeHandleProps;
  invalid?: boolean;
  validationMessage?: string;
};

type TimelineReservationOverlayBlockProps = {
  reservation: SelectionReservation;
  timelineStart: Dayjs;
  timelineEnd: Dayjs;
  invalid?: boolean;
  validationMessage?: string;
};

type ReservationBlockContentProps = {
  reservation: SelectionReservation;
};

type BlockClassInput = {
  reservation: SelectionReservation;
  isGhost?: boolean;
  invalid?: boolean;
  overlay?: boolean;
};

export function TimelineReservationBlock({
  reservation,
  reservationKey,
  rowTable,
  rowSector,
  timelineStart,
  timelineEnd,
  isSelected,
  onClick,
  tableById,
  sectorById,
  dragId,
  dragData,
  resizeStartHandleProps,
  resizeEndHandleProps,
  invalid = false,
  validationMessage,
}: TimelineReservationBlockProps) {
  const { ref, handleRef, isDragSource } = useDraggable({
    id: dragId,
    data: dragData,
  });
  const reservationStart = dayjs(reservation.startTime);
  const reservationEnd = dayjs(reservation.endTime);
  const blockLayout = getReservationBlockLayout({
    reservationStart,
    reservationEnd,
    timelineStart,
    timelineEnd,
    insetX: RESERVATION_INSET_X,
  });

  if (blockLayout.hidden) return null;

  const statusStyle = STATUS_BLOCK_STYLE[reservation.status];
  const statusLabel = getStatusLabel(reservation.status);
  const priorityLabel = formatPriorityLabel(reservation.priority);
  const reservationTable = tableById.get(reservation.tableId);
  const reservationSector = sectorById.get(reservationTable?.sectorId ?? "");

  return (
    <>
      <Tooltip>
        <TooltipTrigger
          ref={ref}
          type="button"
          data-reservation-block="true"
          data-selected={isSelected}
          className={getBlockClassName({
            reservation,
            isGhost: isDragSource,
            invalid,
          })}
          style={{
            left: toZoomScaledX(blockLayout.left),
            top: RESERVATION_INSET_Y,
            width: toZoomScaledX(blockLayout.width),
            height: ROW_HEIGHT_PX - RESERVATION_INSET_Y * 2,
          }}
          onClick={() => {
            if (isDragSource) return;
            onClick(reservationKey);
          }}
          aria-pressed={isSelected}
          aria-selected={isSelected}
        >
          <div
            ref={handleRef}
            className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
          >
            <ReservationBlockContent reservation={reservation} />
          </div>
          <div
            className="group/resize-edge absolute inset-y-0 left-0 z-20 w-3 cursor-ew-resize touch-none"
            {...resizeStartHandleProps}
          >
            <span className="pointer-events-none absolute inset-y-2 left-0 w-0.5 rounded-full bg-slate-400 opacity-0 transition-opacity duration-150 group-hover/resize-edge:opacity-100" />
          </div>
          <div
            className="group/resize-edge absolute inset-y-0 right-0 z-20 w-3 cursor-ew-resize touch-none"
            {...resizeEndHandleProps}
          >
            <span className="pointer-events-none absolute inset-y-2 right-0 w-0.5 rounded-full bg-slate-400 opacity-0 transition-opacity duration-150 group-hover/resize-edge:opacity-100" />
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

      {invalid && validationMessage ? (
        <div
          className="pointer-events-none absolute z-30 whitespace-nowrap rounded-md border border-rose-400 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 shadow-sm"
          style={{
            left: toZoomScaledX(blockLayout.left + blockLayout.width / 2),
            top: ROW_HEIGHT_PX - RESERVATION_INSET_Y + 4,
            transform: "translateX(-50%)",
          }}
        >
          {validationMessage}
        </div>
      ) : null}
    </>
  );
}

export function TimelineReservationOverlayBlock({
  reservation,
  timelineStart,
  timelineEnd,
  invalid = false,
  validationMessage,
}: TimelineReservationOverlayBlockProps) {
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

  return (
    <div className="relative">
      <div
        className={getBlockClassName({
          reservation,
          invalid,
          overlay: true,
        })}
        style={{
          width: toZoomScaledX(blockLayout.width),
          height: ROW_HEIGHT_PX - RESERVATION_INSET_Y * 2,
        }}
      >
        <ReservationBlockContent reservation={reservation} />
      </div>

      {invalid && validationMessage ? (
        <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-rose-400 bg-rose-50 px-2 py-1 text-[11px] font-medium text-rose-700 shadow-sm">
          {validationMessage}
        </div>
      ) : null}
    </div>
  );
}

function ReservationBlockContent({
  reservation,
}: ReservationBlockContentProps) {
  const statusStyle = STATUS_BLOCK_STYLE[reservation.status];
  const statusLabel = getStatusLabel(reservation.status);
  const priorityLabel = formatPriorityLabel(reservation.priority);

  return (
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
  );
}

function getBlockClassName({
  reservation,
  isGhost = false,
  invalid = false,
  overlay = false,
}: BlockClassInput) {
  const statusStyle = STATUS_BLOCK_STYLE[reservation.status];

  return cn(
    "overflow-hidden rounded-lg border text-left transition",
    !overlay && "absolute z-10",
    isGhost && "opacity-35 saturate-50 ring-1 ring-slate-900/20",
    invalid && "border-rose-500/85 ring-2 ring-rose-500/30",
    reservation.status === "CANCELLED" && "timeline-cancelled-stripes",
    statusStyle.blockClassName,
  );
}
