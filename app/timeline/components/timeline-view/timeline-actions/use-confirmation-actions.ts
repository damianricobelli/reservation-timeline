import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import {
  cancelTimelineReservationAction,
  deleteTimelineReservationAction,
} from "@/app/timeline/actions/mutate-timeline-reservation";
import type { ReservationTimelineRecord } from "@/core/types";
import {
  removeReservationByEntityKey,
  replaceReservationByEntityKey,
} from "../timeline-dnd/records";
import type { SelectionReservation } from "../types";
import { runReservationMutation } from "./run-reservation-mutation";
import type {
  PendingReservationAction,
  PendingReservationActionKind,
  ReservationActionsEvent,
} from "./state";
import type { TimelineReservationConfirmationDraft } from "./types";

type UseConfirmationActionsInput = {
  confirmationDraft: TimelineReservationConfirmationDraft;
  dispatch: Dispatch<ReservationActionsEvent>;
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

type UseConfirmationActionsResult = {
  requestCancelReservation: (reservationEntityKey: string) => void;
  requestDeleteReservation: (reservationEntityKey: string) => void;
  closeConfirmationDraft: () => void;
  confirmReservationAction: () => Promise<void>;
};

export function useConfirmationActions({
  confirmationDraft,
  dispatch,
  getReservationByEntityKey,
  setRecords,
  setPendingAction,
  clearPendingAction,
}: UseConfirmationActionsInput): UseConfirmationActionsResult {
  const requestCancelReservation = useCallback(
    (reservationEntityKey: string) => {
      const reservation = getReservationByEntityKey(reservationEntityKey);

      if (!reservation) {
        return;
      }

      dispatch({
        type: "open-confirmation",
        draft: {
          kind: "cancel",
          reservationEntityKey,
          reservation,
        },
      });
    },
    [dispatch, getReservationByEntityKey],
  );

  const requestDeleteReservation = useCallback(
    (reservationEntityKey: string) => {
      const reservation = getReservationByEntityKey(reservationEntityKey);

      if (!reservation) {
        return;
      }

      dispatch({
        type: "open-confirmation",
        draft: {
          kind: "delete",
          reservationEntityKey,
          reservation,
        },
      });
    },
    [dispatch, getReservationByEntityKey],
  );

  const closeConfirmationDraft = useCallback(() => {
    dispatch({ type: "close-confirmation" });
  }, [dispatch]);

  const confirmReservationAction = useCallback(async () => {
    if (!confirmationDraft) {
      return;
    }

    const reservation = getReservationByEntityKey(
      confirmationDraft.reservationEntityKey,
    );

    if (!reservation) {
      dispatch({
        type: "set-confirmation-error",
        message: "This reservation was not found anymore.",
      });
      return;
    }

    await runReservationMutation({
      reservationEntityKey: confirmationDraft.reservationEntityKey,
      kind: confirmationDraft.kind,
      setPendingAction,
      clearPendingAction,
      mutate: async () => {
        if (confirmationDraft.kind === "cancel") {
          const result = await cancelTimelineReservationAction({
            reservationId: reservation.id,
          });

          if (!result.ok) {
            throw new Error(result.message);
          }

          return {
            kind: "cancel" as const,
            data: result.data,
          };
        }

        const result = await deleteTimelineReservationAction({
          reservationId: reservation.id,
        });

        if (!result.ok) {
          throw new Error(result.message);
        }

        return {
          kind: "delete" as const,
          data: result.data,
        };
      },
      onSuccess: (payload) => {
        if (payload.kind === "cancel") {
          setRecords((previous) =>
            replaceReservationByEntityKey(
              previous,
              confirmationDraft.reservationEntityKey,
              {
                ...reservation,
                status: payload.data.nextStatus,
                updatedAt: payload.data.updatedAt,
              },
            ),
          );
        } else {
          setRecords((previous) =>
            removeReservationByEntityKey(
              previous,
              confirmationDraft.reservationEntityKey,
            ),
          );
        }

        dispatch({ type: "close-confirmation" });
      },
      onError: (error) => {
        const message =
          error instanceof Error && error.message
            ? error.message
            : "Unable to complete this action right now. Please try again.";
        dispatch({
          type: "set-confirmation-error",
          message,
        });
      },
    });
  }, [
    clearPendingAction,
    confirmationDraft,
    dispatch,
    getReservationByEntityKey,
    setPendingAction,
    setRecords,
  ]);

  return {
    requestCancelReservation,
    requestDeleteReservation,
    closeConfirmationDraft,
    confirmReservationAction,
  };
}
