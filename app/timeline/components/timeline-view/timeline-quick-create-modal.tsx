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
  TimelineCreateDraft,
  TimelineQuickCreateSubmitInput,
  TimelineQuickCreateSubmitResult,
} from "./use-timeline-reservation-create";
import { formatTimeRange } from "./utils";

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

function TimelineQuickCreateModalForm({
  draft,
  onClose,
  onSubmit,
}: TimelineQuickCreateModalFormProps) {
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
            Quick Create Reservation
          </AlertDialogTitle>
          <p className="text-sm text-slate-600">
            {draft.table.name} · {formatTimeRange(draft.reservation)}
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
          idPrefix="quick-create"
          defaults={{
            partySize: draft.table.capacity.min,
            status: draft.reservation.status,
            priority: draft.reservation.priority,
          }}
          capacityMin={draft.table.capacity.min}
          capacityMax={draft.table.capacity.max}
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
            {isPending ? "Creating..." : "Create reservation"}
          </Button>
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}
