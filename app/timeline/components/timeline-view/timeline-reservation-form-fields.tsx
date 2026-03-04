"use client";

import type { QuickCreateReservationFieldErrors } from "@/app/timeline/actions/validate-quick-create-reservation";
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
  type ReservationPriority,
  type ReservationStatus,
} from "@/core/types";

type ReservationFormDefaults = {
  customerName?: string;
  phone?: string;
  partySize: number;
  status: ReservationStatus;
  priority: ReservationPriority;
  notes?: string;
};

type TimelineReservationFormFieldsProps = {
  idPrefix: string;
  defaults: ReservationFormDefaults;
  capacityMin: number;
  capacityMax: number;
  fieldErrors: QuickCreateReservationFieldErrors;
};

function isStatusValue(value: string): value is ReservationStatus {
  return RESERVATION_STATUS_VALUES.some((status) => status === value);
}

function isPriorityValue(value: string): value is ReservationPriority {
  return RESERVATION_PRIORITY_VALUES.some((priority) => priority === value);
}

/**
 * Shared reservation form field set used by quick-create and edit modals.
 */
export function TimelineReservationFormFields({
  idPrefix,
  defaults,
  capacityMin,
  capacityMax,
  fieldErrors,
}: TimelineReservationFormFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field data-invalid={Boolean(fieldErrors.customerName)}>
        <FieldLabel htmlFor={`${idPrefix}-name`}>Customer name</FieldLabel>
        <FieldContent>
          <Input
            id={`${idPrefix}-name`}
            name="customerName"
            defaultValue={defaults.customerName ?? ""}
            placeholder="Customer name"
            aria-invalid={Boolean(fieldErrors.customerName)}
          />
          <FieldError>{fieldErrors.customerName}</FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(fieldErrors.phone)}>
        <FieldLabel htmlFor={`${idPrefix}-phone`}>Phone</FieldLabel>
        <FieldContent>
          <Input
            id={`${idPrefix}-phone`}
            name="phone"
            defaultValue={defaults.phone ?? ""}
            placeholder="+54 9 341 310 4099"
            aria-invalid={Boolean(fieldErrors.phone)}
          />
          <FieldError>{fieldErrors.phone}</FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(fieldErrors.partySize)}>
        <FieldLabel htmlFor={`${idPrefix}-party-size`}>Party size</FieldLabel>
        <FieldContent>
          <NumberFieldRoot
            id={`${idPrefix}-party-size`}
            name="partySize"
            defaultValue={defaults.partySize}
            min={capacityMin}
            max={capacityMax}
            step={1}
            snapOnStep
            required
            className="w-full"
          >
            <NumberFieldGroup className="w-full">
              <NumberFieldDecrement aria-label="Decrease party size" />
              <NumberFieldInput
                aria-invalid={Boolean(fieldErrors.partySize)}
                className="w-full"
              />
              <NumberFieldIncrement aria-label="Increase party size" />
            </NumberFieldGroup>
          </NumberFieldRoot>
          <FieldError>{fieldErrors.partySize}</FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(fieldErrors.status)}>
        <FieldLabel htmlFor={`${idPrefix}-status`}>Status</FieldLabel>
        <FieldContent>
          <Select name="reservationStatus" defaultValue={defaults.status}>
            <SelectTrigger
              id={`${idPrefix}-status`}
              aria-invalid={Boolean(fieldErrors.status)}
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
          <FieldError>{fieldErrors.status}</FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(fieldErrors.priority)}>
        <FieldLabel htmlFor={`${idPrefix}-priority`}>Priority</FieldLabel>
        <FieldContent>
          <Select name="reservationPriority" defaultValue={defaults.priority}>
            <SelectTrigger
              id={`${idPrefix}-priority`}
              aria-invalid={Boolean(fieldErrors.priority)}
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
          <FieldError>{fieldErrors.priority}</FieldError>
        </FieldContent>
      </Field>

      <Field
        data-invalid={Boolean(fieldErrors.notes)}
        className="sm:col-span-2"
      >
        <FieldLabel htmlFor={`${idPrefix}-notes`}>Notes</FieldLabel>
        <FieldContent>
          <Textarea
            id={`${idPrefix}-notes`}
            name="notes"
            defaultValue={defaults.notes ?? ""}
            placeholder="Optional notes"
          />
          <FieldError>{fieldErrors.notes}</FieldError>
        </FieldContent>
      </Field>
    </div>
  );
}
