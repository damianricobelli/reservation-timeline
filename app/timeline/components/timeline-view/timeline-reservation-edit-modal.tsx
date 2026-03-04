"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTimelineReservationFormAction } from "./timeline-reservation-form-action";
import { TimelineReservationFormFields } from "./timeline-reservation-form-fields";
import type {
  TimelineReservationEditDraft,
  TimelineReservationEditSubmitInput,
  TimelineReservationEditSubmitResult,
} from "./use-timeline-reservation-actions";
import { formatTimeRange } from "./utils";

type TimelineReservationEditModalProps = {
  draft: TimelineReservationEditDraft | null;
  onClose: () => void;
  onSubmit: (
    input: TimelineReservationEditSubmitInput,
  ) => Promise<TimelineReservationEditSubmitResult>;
};

/**
 * Full edit modal with preloaded values for existing reservations.
 */
export function TimelineReservationEditModal({
  draft,
  onClose,
  onSubmit,
}: TimelineReservationEditModalProps) {
  if (!draft) {
    return null;
  }

  const formKey = [
    draft.reservationEntityKey,
    draft.reservation.updatedAt,
    draft.reservation.customer.phone,
  ].join("-");

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <TimelineReservationEditModalForm
        key={formKey}
        draft={draft}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </AlertDialog>
  );
}

type TimelineReservationEditModalFormProps = {
  draft: TimelineReservationEditDraft;
  onClose: () => void;
  onSubmit: (
    input: TimelineReservationEditSubmitInput,
  ) => Promise<TimelineReservationEditSubmitResult>;
};

function TimelineReservationEditModalForm({
  draft,
  onClose,
  onSubmit,
}: TimelineReservationEditModalFormProps) {
  const [state, formAction, isPending] = useTimelineReservationFormAction({
    onSubmit: async (input) =>
      onSubmit(input as TimelineReservationEditSubmitInput),
    onSuccessClose: onClose,
  });

  const tableCapacityMin = draft.table?.capacity.min ?? 1;
  const tableCapacityMax = draft.table?.capacity.max ?? 20;
  const tableCapacityLabel = draft.table
    ? `${draft.table.capacity.min}-${draft.table.capacity.max} guests`
    : "Unknown";

  return (
    <AlertDialogContent className="max-w-[760px] overflow-hidden rounded-3xl p-0 sm:max-w-[760px]">
      <div className="border-b border-slate-200/80 bg-slate-50/70 px-6 py-5">
        <AlertDialogHeader className="items-start gap-2 text-left">
          <AlertDialogTitle className="text-lg leading-none font-semibold">
            Edit Reservation
          </AlertDialogTitle>
          <p className="text-sm text-slate-600">
            {draft.table?.name ?? "Table"} ·{" "}
            {formatTimeRange(draft.reservation)}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full">
              Capacity: {tableCapacityLabel}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              Duration: {draft.reservation.durationMinutes} min
            </Badge>
          </div>
        </AlertDialogHeader>
      </div>

      <form className="grid gap-4 px-6 pb-5" action={formAction}>
        <TimelineReservationFormFields
          idPrefix="edit-reservation"
          defaults={{
            customerName: draft.reservation.customer.name,
            phone: draft.reservation.customer.phone,
            partySize: draft.reservation.partySize,
            status: draft.reservation.status,
            priority: draft.reservation.priority,
            notes: draft.reservation.notes,
          }}
          capacityMin={tableCapacityMin}
          capacityMax={tableCapacityMax}
          fieldErrors={state.fieldErrors}
        />

        {state.message ? (
          <p className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-medium text-rose-700">
            {state.message}
          </p>
        ) : null}

        <AlertDialogFooter className="mt-2 border-t border-slate-200/80 pt-4 sm:justify-end">
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}
