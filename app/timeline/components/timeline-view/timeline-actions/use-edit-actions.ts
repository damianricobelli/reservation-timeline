import type { Dispatch, SetStateAction } from "react";
import { useCallback } from "react";
import { updateTimelineReservationDetailsAction } from "@/app/timeline/actions/mutate-timeline-reservation";
import type { ReservationTimelineRecord } from "@/core/types";
import { replaceReservationByEntityKey } from "../timeline-dnd/records";
import type { SelectionReservation, SelectionTable } from "../types";
import { runReservationMutation } from "./run-reservation-mutation";
import type {
  PendingReservationAction,
  PendingReservationActionKind,
  ReservationActionsEvent,
} from "./state";
import type {
  TimelineReservationEditDraft,
  TimelineReservationEditSubmitInput,
  TimelineReservationEditSubmitResult,
} from "./types";

type UseEditActionsInput = {
  editDraft: TimelineReservationEditDraft | null;
  dispatch: Dispatch<ReservationActionsEvent>;
  getReservationByEntityKey: (
    reservationEntityKey: string,
  ) => SelectionReservation | null;
  setRecords: Dispatch<SetStateAction<ReservationTimelineRecord[]>>;
  tableById: Map<string, SelectionTable>;
  setPendingAction: Dispatch<PendingReservationAction>;
  clearPendingAction: (
    reservationEntityKey: string,
    kind: PendingReservationActionKind,
  ) => void;
};

type UseEditActionsResult = {
  openEditDraft: (reservationEntityKey: string) => void;
  closeEditDraft: () => void;
  submitEditDraft: (
    input: TimelineReservationEditSubmitInput,
  ) => Promise<TimelineReservationEditSubmitResult>;
};

export function useEditActions({
  editDraft,
  dispatch,
  getReservationByEntityKey,
  setRecords,
  tableById,
  setPendingAction,
  clearPendingAction,
}: UseEditActionsInput): UseEditActionsResult {
  const openEditDraft = useCallback(
    (reservationEntityKey: string) => {
      const reservation = getReservationByEntityKey(reservationEntityKey);

      if (!reservation) {
        return;
      }

      dispatch({
        type: "open-edit",
        draft: {
          reservationEntityKey,
          reservation,
          table: tableById.get(reservation.tableId),
        },
      });
    },
    [dispatch, getReservationByEntityKey, tableById],
  );

  const closeEditDraft = useCallback(() => {
    dispatch({ type: "close-edit" });
  }, [dispatch]);

  const submitEditDraft = useCallback(
    async (
      input: TimelineReservationEditSubmitInput,
    ): Promise<TimelineReservationEditSubmitResult> => {
      if (!editDraft) {
        return {
          ok: false,
          message: "Unable to edit reservation: no active reservation draft.",
        };
      }

      const reservation = getReservationByEntityKey(
        editDraft.reservationEntityKey,
      );

      if (!reservation) {
        return {
          ok: false,
          message: "This reservation was not found anymore.",
        };
      }

      const table = tableById.get(reservation.tableId);

      if (
        table &&
        (input.partySize < table.capacity.min ||
          input.partySize > table.capacity.max)
      ) {
        return {
          ok: false,
          message: `Party size must be between ${table.capacity.min} and ${table.capacity.max} for ${table.name}.`,
        };
      }

      try {
        const reservationEntityKey = editDraft.reservationEntityKey;
        let submitResult: TimelineReservationEditSubmitResult = { ok: true };

        await runReservationMutation({
          reservationEntityKey,
          kind: "edit",
          setPendingAction,
          clearPendingAction,
          mutate: async () => {
            const result = await updateTimelineReservationDetailsAction({
              reservationId: reservation.id,
              ...input,
            });

            if (!result.ok) {
              throw new Error(result.message);
            }

            return result.data;
          },
          onSuccess: (data) => {
            setRecords((previous) =>
              replaceReservationByEntityKey(previous, reservationEntityKey, {
                ...reservation,
                customer: {
                  ...reservation.customer,
                  name: data.customerName,
                  phone: data.phone,
                },
                partySize: data.partySize,
                status: data.status,
                priority: data.priority,
                notes: data.notes,
                updatedAt: data.updatedAt,
              }),
            );
            dispatch({ type: "close-edit" });
          },
          onError: (error) => {
            submitResult = {
              ok: false,
              message:
                error instanceof Error && error.message
                  ? error.message
                  : "Unable to save reservation changes right now.",
            };
          },
        });

        return submitResult;
      } catch {
        return {
          ok: false,
          message: "Unable to save reservation changes right now.",
        };
      }
    },
    [
      clearPendingAction,
      dispatch,
      editDraft,
      getReservationByEntityKey,
      setPendingAction,
      setRecords,
      tableById,
    ],
  );

  return {
    openEditDraft,
    closeEditDraft,
    submitEditDraft,
  };
}
