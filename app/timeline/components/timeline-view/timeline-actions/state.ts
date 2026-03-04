import type {
  TimelineReservationConfirmationDraft,
  TimelineReservationEditDraft,
} from "./types";

export type PendingReservationActionKind =
  | "status"
  | "edit"
  | "cancel"
  | "delete";

export type PendingReservationAction = {
  reservationEntityKey: string;
  kind: PendingReservationActionKind;
} | null;

export type ReservationActionsState = {
  editDraft: TimelineReservationEditDraft | null;
  confirmationDraft: TimelineReservationConfirmationDraft;
  confirmationError: string | null;
  pendingAction: PendingReservationAction;
};

export type ReservationActionsEvent =
  | {
      type: "open-edit";
      draft: TimelineReservationEditDraft;
    }
  | {
      type: "close-edit";
    }
  | {
      type: "open-confirmation";
      draft: Exclude<TimelineReservationConfirmationDraft, null>;
    }
  | {
      type: "close-confirmation";
    }
  | {
      type: "set-confirmation-error";
      message: string | null;
    }
  | {
      type: "set-pending";
      pendingAction: PendingReservationAction;
    }
  | {
      type: "clear-pending";
      reservationEntityKey: string;
      kind: PendingReservationActionKind;
    };

export const INITIAL_RESERVATION_ACTIONS_STATE: ReservationActionsState = {
  editDraft: null,
  confirmationDraft: null,
  confirmationError: null,
  pendingAction: null,
};

export function reservationActionsReducer(
  state: ReservationActionsState,
  event: ReservationActionsEvent,
): ReservationActionsState {
  switch (event.type) {
    case "open-edit":
      return {
        ...state,
        editDraft: event.draft,
      };
    case "close-edit":
      return {
        ...state,
        editDraft: null,
      };
    case "open-confirmation":
      return {
        ...state,
        confirmationError: null,
        confirmationDraft: event.draft,
      };
    case "close-confirmation":
      return {
        ...state,
        confirmationError: null,
        confirmationDraft: null,
      };
    case "set-confirmation-error":
      return {
        ...state,
        confirmationError: event.message,
      };
    case "set-pending":
      return {
        ...state,
        pendingAction: event.pendingAction,
      };
    case "clear-pending":
      return {
        ...state,
        pendingAction: clearPendingReservationAction(
          state.pendingAction,
          event.reservationEntityKey,
          event.kind,
        ),
      };
    default:
      return state;
  }
}

export function clearPendingReservationAction(
  current: PendingReservationAction,
  reservationEntityKey: string,
  kind: PendingReservationActionKind,
) {
  if (
    current?.reservationEntityKey === reservationEntityKey &&
    current.kind === kind
  ) {
    return null;
  }

  return current;
}
