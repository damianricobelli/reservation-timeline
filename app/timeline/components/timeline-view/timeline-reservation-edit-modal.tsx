"use client";

import dayjs from "dayjs";
import { useState } from "react";
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

function formatDurationBadge(durationMinutes: number) {
  if (durationMinutes < 60) {
    return `${durationMinutes} min`;
  }

  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (minutes === 0) {
    return `${hours} h`;
  }

  return `${hours} h ${minutes} min`;
}

function TimelineReservationEditModalForm({
  draft,
  onClose,
  onSubmit,
}: TimelineReservationEditModalFormProps) {
  const defaultFrom = dayjs(draft.reservation.startTime).format("HH:mm");
  const defaultTo = dayjs(draft.reservation.endTime).format("HH:mm");
  const [headerFrom, setHeaderFrom] = useState(defaultFrom);
  const [headerTo, setHeaderTo] = useState(defaultTo);
  const [headerDurationMinutes, setHeaderDurationMinutes] = useState(
    draft.reservation.durationMinutes,
  );
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
            {draft.table?.name ?? "Table"} · {headerFrom}-{headerTo}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full">
              Capacity: {tableCapacityLabel}
            </Badge>
            <Badge variant="outline" className="rounded-full">
              Duration: {formatDurationBadge(headerDurationMinutes)}
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
            from: defaultFrom,
            to: defaultTo,
            notes: draft.reservation.notes,
          }}
          serviceHours={draft.serviceHours}
          occupiedTimeRanges={draft.occupiedTimeRanges}
          capacityMin={tableCapacityMin}
          capacityMax={tableCapacityMax}
          fieldErrors={state.fieldErrors}
          onTimeRangeChange={({ from, to, durationMinutes }) => {
            setHeaderFrom(from || defaultFrom);
            setHeaderTo(to || defaultTo);
            setHeaderDurationMinutes(
              durationMinutes ?? draft.reservation.durationMinutes,
            );
          }}
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
