import dayjs from "dayjs";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useState,
} from "react";
import {
  cancelTimelineReservationAction,
  deleteTimelineReservationAction,
  updateTimelineReservationDetailsAction,
  updateTimelineReservationStatusAction,
} from "@/app/timeline/actions/mutate-timeline-reservation";
import type {
  ReservationStatus,
  ReservationTimelineRecord,
} from "@/core/types";
import {
  findReservationByEntityKey,
  removeReservationByEntityKey,
  replaceReservationByEntityKey,
} from "./timeline-dnd/records";
import type {
  SelectionReservation,
  SelectionTable,
  SelectionTableId,
} from "./types";

type PendingReservationActionKind = "status" | "edit" | "cancel" | "delete";

type PendingReservationAction = {
  reservationEntityKey: string;
  kind: PendingReservationActionKind;
} | null;

type ReservationConfirmationKind = "cancel" | "delete";

export type TimelineReservationEditSubmitInput = {
  customerName: string;
  phone: string;
  partySize: number;
  status: SelectionReservation["status"];
  priority: SelectionReservation["priority"];
  notes?: string;
};

export type TimelineReservationEditSubmitResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
    };

export type TimelineReservationEditDraft = {
  reservationEntityKey: string;
  reservation: SelectionReservation;
  table?: SelectionTable;
};

export type TimelineReservationConfirmationDraft = {
  kind: ReservationConfirmationKind;
  reservationEntityKey: string;
  reservation: SelectionReservation;
} | null;

type UseTimelineReservationActionsInput = {
  records: ReservationTimelineRecord[];
  setRecords: Dispatch<SetStateAction<ReservationTimelineRecord[]>>;
  tableById: Map<SelectionTableId, SelectionTable>;
};

export type TimelineReservationActionsApi = {
  editDraft: TimelineReservationEditDraft | null;
  confirmationDraft: TimelineReservationConfirmationDraft;
  confirmationError: string | null;
  pendingAction: PendingReservationAction;
  openEditDraft: (reservationEntityKey: string) => void;
  closeEditDraft: () => void;
  submitEditDraft: (
    input: TimelineReservationEditSubmitInput,
  ) => Promise<TimelineReservationEditSubmitResult>;
  updateReservationStatus: (
    reservationEntityKey: string,
    nextStatus: ReservationStatus,
  ) => void;
  markReservationNoShow: (reservationEntityKey: string) => void;
  requestCancelReservation: (reservationEntityKey: string) => void;
  requestDeleteReservation: (reservationEntityKey: string) => void;
  closeConfirmationDraft: () => void;
  confirmReservationAction: () => Promise<void>;
  isReservationBusy: (reservationEntityKey: string) => boolean;
};

/**
 * Handles reservation-level contextual mutations (edit, status, cancel, delete).
 */
export function useTimelineReservationActions({
  records,
  setRecords,
  tableById,
}: UseTimelineReservationActionsInput): TimelineReservationActionsApi {
  const [editDraft, setEditDraft] =
    useState<TimelineReservationEditDraft | null>(null);
  const [confirmationDraft, setConfirmationDraft] =
    useState<TimelineReservationConfirmationDraft>(null);
  const [confirmationError, setConfirmationError] = useState<string | null>(
    null,
  );
  const [pendingAction, setPendingAction] =
    useState<PendingReservationAction>(null);

  const getReservationByEntityKey = useCallback(
    (reservationEntityKey: string) => {
      return findReservationByEntityKey(records, reservationEntityKey);
    },
    [records],
  );

  const clearPendingAction = useCallback(
    (reservationEntityKey: string, kind: PendingReservationActionKind) => {
      setPendingAction((current) => {
        if (
          current?.reservationEntityKey === reservationEntityKey &&
          current.kind === kind
        ) {
          return null;
        }

        return current;
      });
    },
    [],
  );

  const updateReservationStatus = useCallback(
    (reservationEntityKey: string, nextStatus: ReservationStatus) => {
      const reservation = getReservationByEntityKey(reservationEntityKey);

      if (!reservation || reservation.status === nextStatus) {
        return;
      }

      const previousReservation = reservation;
      const optimisticReservation: SelectionReservation = {
        ...reservation,
        status: nextStatus,
        updatedAt: dayjs().format(),
      };

      setPendingAction({
        reservationEntityKey,
        kind: "status",
      });

      setRecords((previous) =>
        replaceReservationByEntityKey(
          previous,
          reservationEntityKey,
          optimisticReservation,
        ),
      );

      void (async () => {
        try {
          const result = await updateTimelineReservationStatusAction({
            reservationId: reservation.id,
            nextStatus,
          });

          if (!result.ok) {
            setRecords((previous) =>
              replaceReservationByEntityKey(
                previous,
                reservationEntityKey,
                previousReservation,
              ),
            );
            return;
          }

          setRecords((previous) =>
            replaceReservationByEntityKey(previous, reservationEntityKey, {
              ...optimisticReservation,
              status: result.data.nextStatus,
              updatedAt: result.data.updatedAt,
            }),
          );
        } catch {
          setRecords((previous) =>
            replaceReservationByEntityKey(
              previous,
              reservationEntityKey,
              previousReservation,
            ),
          );
        } finally {
          clearPendingAction(reservationEntityKey, "status");
        }
      })();
    },
    [clearPendingAction, getReservationByEntityKey, setRecords],
  );

  const openEditDraft = useCallback(
    (reservationEntityKey: string) => {
      const reservation = getReservationByEntityKey(reservationEntityKey);

      if (!reservation) {
        return;
      }

      setEditDraft({
        reservationEntityKey,
        reservation,
        table: tableById.get(reservation.tableId),
      });
    },
    [getReservationByEntityKey, tableById],
  );

  const closeEditDraft = useCallback(() => {
    setEditDraft(null);
  }, []);

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

      setPendingAction({
        reservationEntityKey: editDraft.reservationEntityKey,
        kind: "edit",
      });

      try {
        const result = await updateTimelineReservationDetailsAction({
          reservationId: reservation.id,
          ...input,
        });

        if (!result.ok) {
          return {
            ok: false,
            message: result.message,
          };
        }

        setRecords((previous) =>
          replaceReservationByEntityKey(
            previous,
            editDraft.reservationEntityKey,
            {
              ...reservation,
              customer: {
                ...reservation.customer,
                name: result.data.customerName,
                phone: result.data.phone,
              },
              partySize: result.data.partySize,
              status: result.data.status,
              priority: result.data.priority,
              notes: result.data.notes,
              updatedAt: result.data.updatedAt,
            },
          ),
        );

        setEditDraft(null);
        return { ok: true };
      } catch {
        return {
          ok: false,
          message: "Unable to save reservation changes right now.",
        };
      } finally {
        clearPendingAction(editDraft.reservationEntityKey, "edit");
      }
    },
    [
      clearPendingAction,
      editDraft,
      getReservationByEntityKey,
      setRecords,
      tableById,
    ],
  );

  const requestCancelReservation = useCallback(
    (reservationEntityKey: string) => {
      const reservation = getReservationByEntityKey(reservationEntityKey);

      if (!reservation) {
        return;
      }

      setConfirmationError(null);
      setConfirmationDraft({
        kind: "cancel",
        reservationEntityKey,
        reservation,
      });
    },
    [getReservationByEntityKey],
  );

  const requestDeleteReservation = useCallback(
    (reservationEntityKey: string) => {
      const reservation = getReservationByEntityKey(reservationEntityKey);

      if (!reservation) {
        return;
      }

      setConfirmationError(null);
      setConfirmationDraft({
        kind: "delete",
        reservationEntityKey,
        reservation,
      });
    },
    [getReservationByEntityKey],
  );

  const closeConfirmationDraft = useCallback(() => {
    setConfirmationError(null);
    setConfirmationDraft(null);
  }, []);

  const confirmReservationAction = useCallback(async () => {
    if (!confirmationDraft) {
      return;
    }

    const reservation = getReservationByEntityKey(
      confirmationDraft.reservationEntityKey,
    );

    if (!reservation) {
      setConfirmationError("This reservation was not found anymore.");
      return;
    }

    setPendingAction({
      reservationEntityKey: confirmationDraft.reservationEntityKey,
      kind: confirmationDraft.kind,
    });

    try {
      if (confirmationDraft.kind === "cancel") {
        const result = await cancelTimelineReservationAction({
          reservationId: reservation.id,
        });

        if (!result.ok) {
          setConfirmationError(result.message);
          return;
        }

        setRecords((previous) =>
          replaceReservationByEntityKey(
            previous,
            confirmationDraft.reservationEntityKey,
            {
              ...reservation,
              status: result.data.nextStatus,
              updatedAt: result.data.updatedAt,
            },
          ),
        );
      } else {
        const result = await deleteTimelineReservationAction({
          reservationId: reservation.id,
        });

        if (!result.ok) {
          setConfirmationError(result.message);
          return;
        }

        setRecords((previous) =>
          removeReservationByEntityKey(
            previous,
            confirmationDraft.reservationEntityKey,
          ),
        );
      }

      setConfirmationError(null);
      setConfirmationDraft(null);
    } catch {
      setConfirmationError(
        "Unable to complete this action right now. Please try again.",
      );
    } finally {
      clearPendingAction(
        confirmationDraft.reservationEntityKey,
        confirmationDraft.kind,
      );
    }
  }, [
    clearPendingAction,
    confirmationDraft,
    getReservationByEntityKey,
    setRecords,
  ]);

  const markReservationNoShow = useCallback(
    (reservationEntityKey: string) => {
      updateReservationStatus(reservationEntityKey, "NO_SHOW");
    },
    [updateReservationStatus],
  );

  const isReservationBusy = useCallback(
    (reservationEntityKey: string) => {
      return pendingAction?.reservationEntityKey === reservationEntityKey;
    },
    [pendingAction],
  );

  return {
    editDraft,
    confirmationDraft,
    confirmationError,
    pendingAction,
    openEditDraft,
    closeEditDraft,
    submitEditDraft,
    updateReservationStatus,
    markReservationNoShow,
    requestCancelReservation,
    requestDeleteReservation,
    closeConfirmationDraft,
    confirmReservationAction,
    isReservationBusy,
  };
}
