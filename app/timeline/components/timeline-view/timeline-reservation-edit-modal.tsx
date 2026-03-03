"use client";

import { useActionState } from "react";
import {
  type QuickCreateReservationActionState,
  validateQuickCreateReservationAction,
} from "@/app/timeline/actions/validate-quick-create-reservation";
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
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
  NumberFieldRoot,
} from "@/components/ui/number-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  RESERVATION_PRIORITY_LABELS,
  RESERVATION_PRIORITY_VALUES,
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_VALUES,
} from "@/core/types";
import type {
  TimelineReservationEditDraft,
  TimelineReservationEditSubmitInput,
  TimelineReservationEditSubmitResult,
} from "./use-timeline-reservation-actions";
import { formatTimeRange } from "./utils";

const INITIAL_ACTION_STATE: QuickCreateReservationActionState = {
  status: "idle",
  fieldErrors: {},
};

function isStatusValue(
  value: string,
): value is TimelineReservationEditSubmitInput["status"] {
  return RESERVATION_STATUS_VALUES.some((status) => status === value);
}

function isPriorityValue(
  value: string,
): value is TimelineReservationEditSubmitInput["priority"] {
  return RESERVATION_PRIORITY_VALUES.some((priority) => priority === value);
}

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
  const [state, formAction, isPending] = useActionState<
    QuickCreateReservationActionState,
    FormData
  >(async (previousState, formData) => {
    const validationState = await validateQuickCreateReservationAction(
      previousState,
      formData,
    );

    if (validationState.status !== "success" || !validationState.data) {
      return validationState;
    }

    const result = await onSubmit(validationState.data);

    if (!result.ok) {
      return {
        status: "error",
        message: result.message,
        fieldErrors: {},
      };
    }

    onClose();
    return INITIAL_ACTION_STATE;
  }, INITIAL_ACTION_STATE);

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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(state.fieldErrors.customerName)}>
            <FieldLabel htmlFor="edit-reservation-name">
              Customer name
            </FieldLabel>
            <FieldContent>
              <Input
                id="edit-reservation-name"
                name="customerName"
                defaultValue={draft.reservation.customer.name}
                placeholder="Customer name"
                aria-invalid={Boolean(state.fieldErrors.customerName)}
              />
              <FieldError>{state.fieldErrors.customerName}</FieldError>
            </FieldContent>
          </Field>

          <Field data-invalid={Boolean(state.fieldErrors.phone)}>
            <FieldLabel htmlFor="edit-reservation-phone">Phone</FieldLabel>
            <FieldContent>
              <Input
                id="edit-reservation-phone"
                name="phone"
                defaultValue={draft.reservation.customer.phone}
                placeholder="+54 9 341 310 4099"
                aria-invalid={Boolean(state.fieldErrors.phone)}
              />
              <FieldError>{state.fieldErrors.phone}</FieldError>
            </FieldContent>
          </Field>

          <Field data-invalid={Boolean(state.fieldErrors.partySize)}>
            <FieldLabel htmlFor="edit-reservation-party-size">
              Party size
            </FieldLabel>
            <FieldContent>
              <NumberFieldRoot
                id="edit-reservation-party-size"
                name="partySize"
                defaultValue={draft.reservation.partySize}
                min={tableCapacityMin}
                max={tableCapacityMax}
                step={1}
                snapOnStep
                required
                className="w-full"
              >
                <NumberFieldGroup className="w-full">
                  <NumberFieldDecrement aria-label="Decrease party size" />
                  <NumberFieldInput
                    aria-invalid={Boolean(state.fieldErrors.partySize)}
                    className="w-full"
                  />
                  <NumberFieldIncrement aria-label="Increase party size" />
                </NumberFieldGroup>
              </NumberFieldRoot>
              <FieldError>{state.fieldErrors.partySize}</FieldError>
            </FieldContent>
          </Field>

          <Field data-invalid={Boolean(state.fieldErrors.status)}>
            <FieldLabel htmlFor="edit-reservation-status">Status</FieldLabel>
            <FieldContent>
              <Select name="status" defaultValue={draft.reservation.status}>
                <SelectTrigger
                  id="edit-reservation-status"
                  aria-invalid={Boolean(state.fieldErrors.status)}
                  className="w-full"
                >
                  <SelectValue placeholder="Select status">
                    {(value) =>
                      typeof value === "string" && isStatusValue(value)
                        ? RESERVATION_STATUS_LABELS[value]
                        : "Select status"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {RESERVATION_STATUS_VALUES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {RESERVATION_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{state.fieldErrors.status}</FieldError>
            </FieldContent>
          </Field>

          <Field data-invalid={Boolean(state.fieldErrors.priority)}>
            <FieldLabel htmlFor="edit-reservation-priority">
              Priority
            </FieldLabel>
            <FieldContent>
              <Select name="priority" defaultValue={draft.reservation.priority}>
                <SelectTrigger
                  id="edit-reservation-priority"
                  aria-invalid={Boolean(state.fieldErrors.priority)}
                  className="w-full"
                >
                  <SelectValue placeholder="Select priority">
                    {(value) =>
                      typeof value === "string" && isPriorityValue(value)
                        ? RESERVATION_PRIORITY_LABELS[value]
                        : "Select priority"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {RESERVATION_PRIORITY_VALUES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {RESERVATION_PRIORITY_LABELS[priority]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError>{state.fieldErrors.priority}</FieldError>
            </FieldContent>
          </Field>

          <Field
            data-invalid={Boolean(state.fieldErrors.notes)}
            className="sm:col-span-2"
          >
            <FieldLabel htmlFor="edit-reservation-notes">Notes</FieldLabel>
            <FieldContent>
              <Textarea
                id="edit-reservation-notes"
                name="notes"
                defaultValue={draft.reservation.notes ?? ""}
                placeholder="Optional notes"
              />
              <FieldError>{state.fieldErrors.notes}</FieldError>
            </FieldContent>
          </Field>
        </div>

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
