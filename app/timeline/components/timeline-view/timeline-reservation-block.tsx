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
import { TimelineReservationContextMenu } from "./timeline-reservation-context-menu";
import { TimelineReservationSummaryCard } from "./timeline-reservation-summary-card";
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
  reservationEntityKey: string;
  rowTable: SelectionTable;
  rowSector: SelectionSector;
  timelineStart: Dayjs;
  timelineEnd: Dayjs;
  isSelected: boolean;
  actionPending: boolean;
  onClick: (reservationKey: string) => void;
  onEditDetails: (reservationEntityKey: string) => void;
  onStatusChange: (
    reservationEntityKey: string,
    nextStatus: SelectionReservation["status"],
  ) => void;
  onMarkNoShow: (reservationEntityKey: string) => void;
  onCancelReservation: (reservationEntityKey: string) => void;
  onDeleteReservation: (reservationEntityKey: string) => void;
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
  reservationEntityKey,
  rowTable,
  rowSector,
  timelineStart,
  timelineEnd,
  isSelected,
  actionPending,
  onClick,
  onEditDetails,
  onStatusChange,
  onMarkNoShow,
  onCancelReservation,
  onDeleteReservation,
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

  const reservationTable = tableById.get(reservation.tableId);
  const reservationSector = sectorById.get(reservationTable?.sectorId ?? "");

  return (
    <>
      <Tooltip>
        <TimelineReservationContextMenu
          reservation={reservation}
          reservationEntityKey={reservationEntityKey}
          tableName={reservationTable?.name ?? rowTable.name}
          sectorName={reservationSector?.name ?? rowSector.name}
          disabled={actionPending}
          onEditDetails={onEditDetails}
          onStatusChange={onStatusChange}
          onMarkNoShow={onMarkNoShow}
          onCancelReservation={onCancelReservation}
          onDeleteReservation={onDeleteReservation}
        >
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
            onContextMenu={() => {
              if (!isSelected) {
                onClick(reservationKey);
              }
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
        </TimelineReservationContextMenu>

        <TooltipContent>
          <TimelineReservationSummaryCard
            reservation={reservation}
            tableName={reservationTable?.name ?? rowTable.name}
            sectorName={reservationSector?.name ?? rowSector.name}
          />
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
