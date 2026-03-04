import dayjs from "dayjs";
import { type Dispatch, type SetStateAction, useCallback } from "react";
import { updateTimelineReservationStatusAction } from "@/app/timeline/actions/mutate-timeline-reservation";
import type {
  ReservationStatus,
  ReservationTimelineRecord,
} from "@/core/types";
import { useTimelineQueryState } from "@/hooks/use-timeline-query-state";
import { replaceReservationByEntityKey } from "../timeline-dnd/records";
import type { SelectionReservation } from "../types";
import { runReservationMutation } from "./run-reservation-mutation";
import type {
  PendingReservationAction,
  PendingReservationActionKind,
} from "./state";

type UseStatusActionsInput = {
  getReservationByEntityKey: (
    reservationEntityKey: string,
  ) => SelectionReservation | null;
  setRecords: Dispatch<SetStateAction<ReservationTimelineRecord[]>>;
  setPendingAction: Dispatch<PendingReservationAction>;
  clearPendingAction: (
    reservationEntityKey: string,
    kind: PendingReservationActionKind,
  ) => void;
};

type UseStatusActionsResult = {
  updateReservationStatus: (
    reservationEntityKey: string,
    nextStatus: ReservationStatus,
  ) => void;
  markReservationNoShow: (reservationEntityKey: string) => void;
};

export function useStatusActions({
  getReservationByEntityKey,
  setRecords,
  setPendingAction,
  clearPendingAction,
}: UseStatusActionsInput): UseStatusActionsResult {
  const [statusFilters, setStatusFilters] = useTimelineQueryState("status");

  const updateReservationStatus = useCallback(
    (reservationEntityKey: string, nextStatus: ReservationStatus) => {
      const reservation = getReservationByEntityKey(reservationEntityKey);

      if (!reservation || reservation.status === nextStatus) {
        return;
      }

      if (!statusFilters.includes(nextStatus)) {
        setStatusFilters((previous) => {
          if (previous.includes(nextStatus)) {
            return previous;
          }

          return [...previous, nextStatus];
        });
      }

      const previousReservation = reservation;
      const optimisticReservation: SelectionReservation = {
        ...reservation,
        status: nextStatus,
        updatedAt: dayjs().format(),
      };

      setRecords((previous) =>
        replaceReservationByEntityKey(
          previous,
          reservationEntityKey,
          optimisticReservation,
        ),
      );

      void runReservationMutation({
        reservationEntityKey,
        kind: "status",
        setPendingAction,
        clearPendingAction,
        mutate: async () => {
          const result = await updateTimelineReservationStatusAction({
            reservationId: reservation.id,
            nextStatus,
          });

          if (!result.ok) {
            throw new Error(result.message);
          }

          return result.data;
        },
        onSuccess: (data) => {
          setRecords((previous) =>
            replaceReservationByEntityKey(previous, reservationEntityKey, {
              ...optimisticReservation,
              status: data.nextStatus,
              updatedAt: data.updatedAt,
            }),
          );
        },
        onError: () => {
          setRecords((previous) =>
            replaceReservationByEntityKey(
              previous,
              reservationEntityKey,
              previousReservation,
            ),
          );
        },
      });
    },
    [
      clearPendingAction,
      getReservationByEntityKey,
      setPendingAction,
      setRecords,
      setStatusFilters,
      statusFilters,
    ],
  );

  const markReservationNoShow = useCallback(
    (reservationEntityKey: string) => {
      updateReservationStatus(reservationEntityKey, "NO_SHOW");
    },
    [updateReservationStatus],
  );

  return {
    updateReservationStatus,
    markReservationNoShow,
  };
}
