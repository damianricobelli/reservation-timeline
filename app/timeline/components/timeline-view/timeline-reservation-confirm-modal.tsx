"use client";

import dayjs from "dayjs";
import { AlertTriangleIcon, BanIcon, Trash2Icon } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type {
  TimelineReservationActionsApi,
  TimelineReservationConfirmationDraft,
} from "./use-timeline-reservation-actions";

type TimelineReservationConfirmModalProps = {
  draft: TimelineReservationConfirmationDraft;
  errorMessage: string | null;
  pendingAction: TimelineReservationActionsApi["pendingAction"];
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

/**
 * Shared confirmation modal for cancel and delete reservation actions.
 */
export function TimelineReservationConfirmModal({
  draft,
  errorMessage,
  pendingAction,
  onClose,
  onConfirm,
}: TimelineReservationConfirmModalProps) {
  if (!draft) {
    return null;
  }

  const isDelete = draft.kind === "delete";
  const isPending =
    pendingAction?.reservationEntityKey === draft.reservationEntityKey &&
    pendingAction.kind === draft.kind;
  const title = isDelete ? "Delete reservation?" : "Cancel reservation?";
  const actionLabel = isDelete
    ? isPending
      ? "Deleting..."
      : "Delete permanently"
    : isPending
      ? "Cancelling..."
      : "Cancel reservation";

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <AlertDialogContent className="max-w-[520px] rounded-3xl">
        <AlertDialogHeader className="items-start text-left sm:items-start sm:text-left">
          <AlertDialogMedia className="bg-rose-100 text-rose-600">
            {isDelete ? (
              <Trash2Icon className="size-6" />
            ) : (
              <BanIcon className="size-6" />
            )}
          </AlertDialogMedia>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="block">
              {draft.reservation.customer.name} •{" "}
              {dayjs(draft.reservation.startTime).format("ddd, MMM D · HH:mm")}
            </span>
            <span className="mt-1 block text-slate-600">
              {isDelete
                ? "This will permanently remove the reservation from the timeline."
                : "This will update this reservation status to Cancelled."}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {errorMessage ? (
          <div className="flex items-start gap-2 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
            <p>{errorMessage}</p>
          </div>
        ) : null}

        <AlertDialogFooter className="sm:justify-end">
          <AlertDialogCancel disabled={isPending}>
            Keep reservation
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              void onConfirm();
            }}
          >
            {actionLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
