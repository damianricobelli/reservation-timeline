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
  TimelineCreateDraft,
  TimelineQuickCreateSubmitInput,
  TimelineQuickCreateSubmitResult,
} from "./use-timeline-reservation-create";

type TimelineQuickCreateModalProps = {
  draft: TimelineCreateDraft | null;
  onClose: () => void;
  onSubmit: (
    input: TimelineQuickCreateSubmitInput,
  ) => TimelineQuickCreateSubmitResult;
};

/**
 * Local uncontrolled quick-create form using `useActionState` with a typed form action.
 */
export function TimelineQuickCreateModal({
  draft,
  onClose,
  onSubmit,
}: TimelineQuickCreateModalProps) {
  if (!draft) {
    return null;
  }

  const draftKey = `${draft.dateKey}-${draft.table.id}-${draft.reservation.startTime}-${draft.reservation.endTime}`;

  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <TimelineQuickCreateModalForm
        key={draftKey}
        draft={draft}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </AlertDialog>
  );
}

type TimelineQuickCreateModalFormProps = {
  draft: TimelineCreateDraft;
  onClose: () => void;
  onSubmit: (
    input: TimelineQuickCreateSubmitInput,
  ) => TimelineQuickCreateSubmitResult;
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

function TimelineQuickCreateModalForm({
  draft,
  onClose,
  onSubmit,
}: TimelineQuickCreateModalFormProps) {
  const defaultFrom = dayjs(draft.reservation.startTime).format("HH:mm");
  const defaultTo = dayjs(draft.reservation.endTime).format("HH:mm");
  const [headerFrom, setHeaderFrom] = useState(defaultFrom);
  const [headerTo, setHeaderTo] = useState(defaultTo);
  const [headerDurationMinutes, setHeaderDurationMinutes] = useState(
    draft.reservation.durationMinutes,
  );
  const [state, formAction, isPending] = useTimelineReservationFormAction({
    onSubmit: async (input) =>
      onSubmit(input as TimelineQuickCreateSubmitInput),
    onSuccessClose: onClose,
  });

  const tableCapacityLabel = `${draft.table.capacity.min}-${draft.table.capacity.max} guests`;

  return (
    <AlertDialogContent className="max-w-[720px] overflow-hidden rounded-3xl p-0 sm:max-w-[720px]">
      <div className="border-b border-slate-200/80 bg-slate-50/70 px-6 py-5">
        <AlertDialogHeader className="items-start gap-2 text-left">
          <AlertDialogTitle className="text-lg leading-none font-semibold">
            Create Reservation
          </AlertDialogTitle>
          <p className="text-sm text-slate-600">
            {draft.table.name} · {headerFrom}-{headerTo}
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
          idPrefix="quick-create"
          defaults={{
            partySize: draft.table.capacity.min,
            status: draft.reservation.status,
            priority: draft.reservation.priority,
            from: defaultFrom,
            to: defaultTo,
          }}
          serviceHours={draft.serviceHours}
          occupiedTimeRanges={draft.occupiedTimeRanges}
          capacityMin={draft.table.capacity.min}
          capacityMax={draft.table.capacity.max}
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
            {isPending ? "Creating..." : "Create reservation"}
          </Button>
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}
