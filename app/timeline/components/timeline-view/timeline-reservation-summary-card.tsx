"use client";

import { Clock3Icon, PhoneIcon, StarIcon, UsersIcon } from "lucide-react";
import { STATUS_BLOCK_STYLE } from "@/core/constants";
import { RESERVATION_STATUS_LABELS } from "@/core/types";
import { cn } from "@/lib/utils";
import type { SelectionReservation } from "./types";
import { formatPriorityLabel, formatTimeRange } from "./utils";

type TimelineReservationSummaryCardProps = {
  reservation: SelectionReservation;
  tableName: string;
  sectorName: string;
};

/**
 * Shared reservation summary card used in contextual surfaces.
 */
export function TimelineReservationSummaryCard({
  reservation,
  tableName,
  sectorName,
}: TimelineReservationSummaryCardProps) {
  const statusStyle = STATUS_BLOCK_STYLE[reservation.status];
  const priorityLabel = formatPriorityLabel(reservation.priority);

  return (
    <div className="p-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {reservation.customer.name}
          </p>
          <p className="truncate text-[11px] text-slate-500">
            {tableName} · {sectorName}
          </p>
        </div>

        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
            statusStyle.statusBadgeClassName,
          )}
        >
          {RESERVATION_STATUS_LABELS[reservation.status]}
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700">
        <span className="inline-flex items-center gap-1.5">
          <Clock3Icon className="size-3 text-slate-500" />
          <span className="tabular-nums">{formatTimeRange(reservation)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <UsersIcon className="size-3 text-slate-500" />
          <span>{reservation.partySize} guests</span>
        </span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700">
        <span className="inline-flex items-center gap-1.5">
          <PhoneIcon className="size-3 text-slate-500" />
          <span className="truncate">{reservation.customer.phone}</span>
        </span>
        {priorityLabel ? (
          <span className="inline-flex items-center gap-1.5">
            <StarIcon className="size-3 text-slate-500" />
            <span className="truncate">{priorityLabel}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
