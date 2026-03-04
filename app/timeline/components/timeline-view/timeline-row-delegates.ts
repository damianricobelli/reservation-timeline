import type { ReservationStatus } from "@/core/types";
import type { TimelineReservationActionsApi } from "./use-timeline-reservation-actions";
import type { TimelineReservationCreateApi } from "./use-timeline-reservation-create";
import type { TimelineReservationDndApi } from "./use-timeline-reservation-dnd";

/**
 * Shared row-level delegates to avoid prop fan-out across right content/day/row layers.
 */
export type TimelineRowDelegates = {
  onReservationClick: (reservationKey: string) => void;
  onEditDetails: (reservationEntityKey: string) => void;
  onStatusChange: (
    reservationEntityKey: string,
    nextStatus: ReservationStatus,
  ) => void;
  onMarkNoShow: (reservationEntityKey: string) => void;
  onCancelReservation: (reservationEntityKey: string) => void;
  onDeleteReservation: (reservationEntityKey: string) => void;
  isReservationActionPending: (reservationEntityKey: string) => boolean;
  dndApi: TimelineReservationDndApi;
  createApi: TimelineReservationCreateApi;
};

export function buildTimelineRowDelegates({
  onReservationClick,
  dndApi,
  createApi,
  reservationActionsApi,
}: {
  onReservationClick: (reservationKey: string) => void;
  dndApi: TimelineReservationDndApi;
  createApi: TimelineReservationCreateApi;
  reservationActionsApi: TimelineReservationActionsApi;
}): TimelineRowDelegates {
  return {
    onReservationClick,
    onEditDetails: reservationActionsApi.openEditDraft,
    onStatusChange: reservationActionsApi.updateReservationStatus,
    onMarkNoShow: reservationActionsApi.markReservationNoShow,
    onCancelReservation: reservationActionsApi.requestCancelReservation,
    onDeleteReservation: reservationActionsApi.requestDeleteReservation,
    isReservationActionPending: reservationActionsApi.isReservationBusy,
    dndApi,
    createApi,
  };
}
