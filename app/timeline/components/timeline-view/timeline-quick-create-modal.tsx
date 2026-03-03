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

const STATUS_LABELS: Record<TimelineQuickCreateSubmitInput["status"], string> =
  {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    SEATED: "Seated",
    FINISHED: "Finished",
    NO_SHOW: "No Show",
    CANCELLED: "Cancelled",
  };

const PRIORITY_LABELS: Record<
  TimelineQuickCreateSubmitInput["priority"],
  string
> = {
  STANDARD: "Standard",
  VIP: "VIP",
  LARGE_GROUP: "Large Group",
};

const INITIAL_ACTION_STATE: QuickCreateReservationActionState = {
  status: "idle",
  fieldErrors: {},
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

    const result = onSubmit(validationState.data);

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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field data-invalid={Boolean(state.fieldErrors.customerName)}>
            <FieldLabel htmlFor="quick-create-name">Customer name</FieldLabel>
            <FieldContent>
              <Input
                id="quick-create-name"
                name="customerName"
                placeholder="Customer name"
                aria-invalid={Boolean(state.fieldErrors.customerName)}
              />
              <FieldError>{state.fieldErrors.customerName}</FieldError>
            </FieldContent>
          </Field>

          <Field data-invalid={Boolean(state.fieldErrors.phone)}>
            <FieldLabel htmlFor="quick-create-phone">Phone</FieldLabel>
            <FieldContent>
              <Input
                id="quick-create-phone"
                name="phone"
                placeholder="+54 9 341 310 4099"
                aria-invalid={Boolean(state.fieldErrors.phone)}
              />
              <FieldError>{state.fieldErrors.phone}</FieldError>
            </FieldContent>
          </Field>

          <Field data-invalid={Boolean(state.fieldErrors.partySize)}>
            <FieldLabel htmlFor="quick-create-party-size">
              Party size
            </FieldLabel>
            <FieldContent>
              <NumberFieldRoot
                id="quick-create-party-size"
                name="partySize"
                defaultValue={draft.table.capacity.min}
                min={draft.table.capacity.min}
                max={draft.table.capacity.max}
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
            <FieldLabel htmlFor="quick-create-status">Status</FieldLabel>
            <FieldContent>
              <Select name="status" defaultValue="CONFIRMED">
                <SelectTrigger
                  id="quick-create-status"
                  aria-invalid={Boolean(state.fieldErrors.status)}
                  className="w-full"
                >
                  <SelectValue placeholder="Select status">
                    {(value) =>
                      typeof value === "string"
                        ? (STATUS_LABELS[
                            value as TimelineQuickCreateSubmitInput["status"]
                          ] ?? value)
                        : "Select status"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="SEATED">Seated</SelectItem>
                  <SelectItem value="FINISHED">Finished</SelectItem>
                  <SelectItem value="NO_SHOW">No Show</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <FieldError>{state.fieldErrors.status}</FieldError>
            </FieldContent>
          </Field>

          <Field data-invalid={Boolean(state.fieldErrors.priority)}>
            <FieldLabel htmlFor="quick-create-priority">Priority</FieldLabel>
            <FieldContent>
              <Select name="priority" defaultValue="STANDARD">
                <SelectTrigger
                  id="quick-create-priority"
                  aria-invalid={Boolean(state.fieldErrors.priority)}
                  className="w-full"
                >
                  <SelectValue placeholder="Select priority">
                    {(value) =>
                      typeof value === "string"
                        ? (PRIORITY_LABELS[
                            value as TimelineQuickCreateSubmitInput["priority"]
                          ] ?? value)
                        : "Select priority"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="LARGE_GROUP">Large group</SelectItem>
                </SelectContent>
              </Select>
              <FieldError>{state.fieldErrors.priority}</FieldError>
            </FieldContent>
          </Field>

          <Field
            data-invalid={Boolean(state.fieldErrors.notes)}
            className="sm:col-span-2"
          >
            <FieldLabel htmlFor="quick-create-notes">Notes</FieldLabel>
            <FieldContent>
              <Textarea
                id="quick-create-notes"
                name="notes"
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
            {isPending ? "Creating..." : "Create reservation"}
          </Button>
        </AlertDialogFooter>
      </form>
    </AlertDialogContent>
  );
}
