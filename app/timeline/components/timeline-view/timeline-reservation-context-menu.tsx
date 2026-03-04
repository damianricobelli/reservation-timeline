"use client";

import {
  BanIcon,
  CircleDotIcon,
  PencilIcon,
  Trash2Icon,
  UserRoundXIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_VALUES,
  type ReservationStatus,
} from "@/core/types";
import type { SelectionReservation } from "./types";

const STATUS_DOT_CLASS_BY_VALUE: Record<ReservationStatus, string> = {
  PENDING: "bg-amber-400",
  CONFIRMED: "bg-blue-500",
  SEATED: "bg-emerald-500",
  FINISHED: "bg-slate-400",
  NO_SHOW: "bg-rose-500",
  CANCELLED: "bg-slate-300",
};

type TimelineReservationContextMenuProps = {
  reservation: SelectionReservation;
  reservationEntityKey: string;
  disabled?: boolean;
  onEditDetails: (reservationEntityKey: string) => void;
  onStatusChange: (
    reservationEntityKey: string,
    nextStatus: ReservationStatus,
  ) => void;
  onMarkNoShow: (reservationEntityKey: string) => void;
  onCancelReservation: (reservationEntityKey: string) => void;
  onDeleteReservation: (reservationEntityKey: string) => void;
  children: ReactNode;
};

/**
 * Context menu used by timeline reservation blocks.
 */
export function TimelineReservationContextMenu({
  reservation,
  reservationEntityKey,
  disabled = false,
  onEditDetails,
  onStatusChange,
  onMarkNoShow,
  onCancelReservation,
  onDeleteReservation,
  children,
}: TimelineReservationContextMenuProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger className="contents">{children}</ContextMenuTrigger>

      <ContextMenuContent alignOffset={6} className="min-w-72">

        <ContextMenuGroup>
          <ContextMenuItem
            disabled={disabled}
            onClick={() => onEditDetails(reservationEntityKey)}
          >
            <PencilIcon />
            Edit Details
          </ContextMenuItem>

          <ContextMenuSub>
            <ContextMenuSubTrigger className="flex items-center gap-2">
              <CircleDotIcon />
              Change Status
            </ContextMenuSubTrigger>
            <ContextMenuSubContent sideOffset={6} className="min-w-56">
              {RESERVATION_STATUS_VALUES.map((statusValue) => {
                const isCurrent = statusValue === reservation.status;

                return (
                  <ContextMenuItem
                    key={statusValue}
                    disabled={disabled || isCurrent}
                    onClick={() =>
                      onStatusChange(reservationEntityKey, statusValue)
                    }
                  >
                    <span
                      className={`size-2 shrink-0 rounded-full ${STATUS_DOT_CLASS_BY_VALUE[statusValue]}`}
                    />
                    {RESERVATION_STATUS_LABELS[statusValue]}
                    {isCurrent ? (
                      <ContextMenuShortcut>Current</ContextMenuShortcut>
                    ) : null}
                  </ContextMenuItem>
                );
              })}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuItem
            disabled={disabled || reservation.status === "NO_SHOW"}
            onClick={() => onMarkNoShow(reservationEntityKey)}
          >
            <UserRoundXIcon />
            Mark as No-Show
          </ContextMenuItem>

          <ContextMenuSeparator />

          <ContextMenuItem
            variant="destructive"
            disabled={disabled || reservation.status === "CANCELLED"}
            onClick={() => onCancelReservation(reservationEntityKey)}
          >
            <BanIcon />
            Cancel Reservation
          </ContextMenuItem>

          <ContextMenuItem
            variant="destructive"
            disabled={disabled}
            onClick={() => onDeleteReservation(reservationEntityKey)}
          >
            <Trash2Icon />
            Delete Reservation
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  );
}
