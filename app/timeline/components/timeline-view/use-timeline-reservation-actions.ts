import { useCallback, useReducer } from "react";
import {
  INITIAL_RESERVATION_ACTIONS_STATE,
  type PendingReservationAction,
  type PendingReservationActionKind,
  reservationActionsReducer,
} from "./timeline-actions/state";
import type {
  TimelineReservationActionsApi,
  UseTimelineReservationActionsInput,
} from "./timeline-actions/types";
import { useConfirmationActions } from "./timeline-actions/use-confirmation-actions";
import { useEditActions } from "./timeline-actions/use-edit-actions";
import { useStatusActions } from "./timeline-actions/use-status-actions";
import { findReservationByEntityKey } from "./timeline-dnd/records";

export type {
  TimelineReservationActionsApi,
  TimelineReservationConfirmationDraft,
  TimelineReservationEditDraft,
  TimelineReservationEditSubmitInput,
  TimelineReservationEditSubmitResult,
} from "./timeline-actions/types";

/**
 * Handles reservation-level contextual mutations (edit, status, cancel, delete).
 *
 * This hook composes focused sub-hooks for each mutation surface.
 */
export function useTimelineReservationActions({
  records,
  setRecords,
  tableById,
}: UseTimelineReservationActionsInput): TimelineReservationActionsApi {
  const [state, dispatch] = useReducer(
    reservationActionsReducer,
    INITIAL_RESERVATION_ACTIONS_STATE,
  );

  const setPendingAction = useCallback(
    (pendingAction: PendingReservationAction) => {
      dispatch({
        type: "set-pending",
        pendingAction,
      });
    },
    [],
  );

  const clearPendingAction = useCallback(
    (reservationEntityKey: string, kind: PendingReservationActionKind) => {
      dispatch({
        type: "clear-pending",
        reservationEntityKey,
        kind,
      });
    },
    [],
  );

  const getReservationByEntityKey = useCallback(
    (reservationEntityKey: string) => {
      return findReservationByEntityKey(records, reservationEntityKey);
    },
    [records],
  );

  const { updateReservationStatus, markReservationNoShow } = useStatusActions({
    getReservationByEntityKey,
    setRecords,
    setPendingAction,
    clearPendingAction,
  });

  const { openEditDraft, closeEditDraft, submitEditDraft } = useEditActions({
    editDraft: state.editDraft,
    dispatch,
    getReservationByEntityKey,
    setRecords,
    tableById,
    setPendingAction,
    clearPendingAction,
  });

  const {
    requestCancelReservation,
    requestDeleteReservation,
    closeConfirmationDraft,
    confirmReservationAction,
  } = useConfirmationActions({
    confirmationDraft: state.confirmationDraft,
    dispatch,
    getReservationByEntityKey,
    setRecords,
    setPendingAction,
    clearPendingAction,
  });

  const isReservationBusy = useCallback(
    (reservationEntityKey: string) => {
      return state.pendingAction?.reservationEntityKey === reservationEntityKey;
    },
    [state.pendingAction],
  );

  return {
    editDraft: state.editDraft,
    confirmationDraft: state.confirmationDraft,
    confirmationError: state.confirmationError,
    pendingAction: state.pendingAction,
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
