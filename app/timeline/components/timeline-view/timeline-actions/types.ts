import type { Dispatch, SetStateAction } from "react";
import type {
  ReservationStatus,
  ReservationTimelineRecord,
} from "@/core/types";
import type {
  SelectionReservation,
  SelectionTable,
  SelectionTableId,
} from "../types";
import type { PendingReservationAction } from "./state";

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

export type UseTimelineReservationActionsInput = {
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
