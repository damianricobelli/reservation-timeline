"use client";

import { useCallback, useMemo, useState } from "react";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SLOT_MINUTES } from "@/core/constants";
import {
  RESERVATION_PRIORITY_LABELS,
  RESERVATION_PRIORITY_VALUES,
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_VALUES,
  type ReservationPriority,
  type ReservationStatus,
  type ServiceHour,
} from "@/core/types";

type ReservationFormDefaults = {
  customerName?: string;
  phone?: string;
  partySize: number;
  status: ReservationStatus;
  priority: ReservationPriority;
  from: string;
  to: string;
  notes?: string;
};

type TimelineReservationFormFieldsProps = {
  idPrefix: string;
  defaults: ReservationFormDefaults;
  serviceHours: ServiceHour[];
  occupiedTimeRanges: { start: string; end: string }[];
  capacityMin: number;
  capacityMax: number;
  fieldErrors: QuickCreateReservationFieldErrors;
  onTimeRangeChange?: (timeRange: {
    from: string;
    to: string;
    durationMinutes: number | null;
  }) => void;
};

function isStatusValue(value: string): value is ReservationStatus {
  return RESERVATION_STATUS_VALUES.some((status) => status === value);
}

function isPriorityValue(value: string): value is ReservationPriority {
  return RESERVATION_PRIORITY_VALUES.some((priority) => priority === value);
}

type TimeOption = {
  value: string;
  label: string;
  absoluteMinutes: number;
};

type TimeOptionGroup = {
  key: string;
  label: string;
  options: TimeOption[];
};

type AbsoluteInterval = {
  start: number;
  end: number;
};

type ResolvedTimeRange = {
  from: string;
  to: string;
  durationMinutes: number | null;
};

const MIN_ALLOWED_DURATION_MINUTES = 30;
const MAX_ALLOWED_DURATION_MINUTES = 6 * 60;

function parseHourTime(time: string) {
  const [hoursPart, minutesPart] = time.split(":");
  const hours = Number.parseInt(hoursPart ?? "0", 10);
  const minutes = Number.parseInt(minutesPart ?? "0", 10);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return 0;
  }

  return hours * 60 + minutes;
}

function formatMinutesAsTime(totalMinutes: number) {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function buildTimeOptionGroups(serviceHours: ServiceHour[]) {
  if (serviceHours.length === 0) {
    const options: TimeOption[] = [];

    for (
      let absoluteMinutes = 0;
      absoluteMinutes <= 1440;
      absoluteMinutes += SLOT_MINUTES
    ) {
      options.push({
        value: formatMinutesAsTime(absoluteMinutes),
        label: formatMinutesAsTime(absoluteMinutes),
        absoluteMinutes,
      });
    }

    return [
      {
        key: "service-hour-fallback",
        label: "All day",
        options,
      },
    ];
  }

  return serviceHours.map((window, index) => {
    const startMinutes = parseHourTime(window.start);
    let endMinutes = parseHourTime(window.end);

    if (endMinutes <= startMinutes) {
      endMinutes += 1440;
    }

    const options: TimeOption[] = [];

    for (
      let absoluteMinutes = startMinutes;
      absoluteMinutes <= endMinutes;
      absoluteMinutes += SLOT_MINUTES
    ) {
      options.push({
        value: formatMinutesAsTime(absoluteMinutes),
        label: formatMinutesAsTime(absoluteMinutes),
        absoluteMinutes,
      });
    }

    return {
      key: `service-hour-${index}-${window.start}-${window.end}`,
      label: `${window.start} - ${window.end}`,
      options,
    };
  });
}

function filterTimeOptionGroups(
  groups: TimeOptionGroup[],
  predicate: (option: TimeOption, group: TimeOptionGroup) => boolean,
) {
  return groups
    .map((group) => ({
      ...group,
      options: group.options.filter((option) => predicate(option, group)),
    }))
    .filter((group) => group.options.length > 0);
}

function findOptionMatch(
  groups: TimeOptionGroup[],
  value: string | undefined,
): { group: TimeOptionGroup; option: TimeOption } | null {
  if (!value) {
    return null;
  }

  for (const group of groups) {
    for (const option of group.options) {
      if (option.value === value) {
        return { group, option };
      }
    }
  }

  return null;
}

function findOptionAbsoluteMinute(
  groups: TimeOptionGroup[],
  value: string | undefined,
) {
  return findOptionMatch(groups, value)?.option.absoluteMinutes ?? null;
}

function toSafeSelectValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeAbsoluteEnd(start: number, end: number) {
  return end <= start ? end + 1440 : end;
}

function rangesOverlap(
  first: { start: number; end: number },
  second: { start: number; end: number },
) {
  return first.start < second.end && first.end > second.start;
}

function isDurationAllowed(start: number, end: number) {
  const durationMinutes = end - start;

  return (
    durationMinutes >= MIN_ALLOWED_DURATION_MINUTES &&
    durationMinutes <= MAX_ALLOWED_DURATION_MINUTES
  );
}

/**
 * Shared reservation form field set used by quick-create and edit modals.
 */
export function TimelineReservationFormFields({
  idPrefix,
  defaults,
  serviceHours,
  occupiedTimeRanges,
  capacityMin,
  capacityMax,
  fieldErrors,
  onTimeRangeChange,
}: TimelineReservationFormFieldsProps) {
  const timeOptionGroups = useMemo(
    () => buildTimeOptionGroups(serviceHours),
    [serviceHours],
  );
  const occupiedIntervals = useMemo<AbsoluteInterval[]>(
    () =>
      occupiedTimeRanges.map((range) => {
        const start = parseHourTime(range.start);
        const end = normalizeAbsoluteEnd(start, parseHourTime(range.end));

        return { start, end };
      }),
    [occupiedTimeRanges],
  );
  const hasIntervalConflict = useMemo(
    () => (start: number, end: number) =>
      occupiedIntervals.some((interval) =>
        rangesOverlap({ start, end }, interval),
      ),
    [occupiedIntervals],
  );
  const safeDefaultFrom = toSafeSelectValue(defaults.from);
  const safeDefaultTo = toSafeSelectValue(defaults.to);
  const fromDefaultValue = useMemo(() => {
    const defaultFromMatch = findOptionMatch(timeOptionGroups, safeDefaultFrom);
    const defaultFromMinutes = defaultFromMatch?.option.absoluteMinutes ?? null;
    const defaultFromGroup = defaultFromMatch?.group;
    const defaultFromGroupEndMinutes =
      defaultFromGroup?.options[defaultFromGroup.options.length - 1]
        ?.absoluteMinutes;

    if (
      defaultFromMinutes === null ||
      defaultFromGroupEndMinutes === undefined ||
      defaultFromGroupEndMinutes - defaultFromMinutes <=
        MIN_ALLOWED_DURATION_MINUTES
    ) {
      return "";
    }

    const hasValidEndInSameRange = defaultFromGroup?.options.some(
        (endOption) =>
          endOption.absoluteMinutes > defaultFromMinutes &&
          isDurationAllowed(defaultFromMinutes, endOption.absoluteMinutes) &&
          !hasIntervalConflict(defaultFromMinutes, endOption.absoluteMinutes),
      ) ?? false;

    if (!hasValidEndInSameRange) {
      return "";
    }

    return safeDefaultFrom;
  }, [hasIntervalConflict, safeDefaultFrom, timeOptionGroups]);
  const [fromValue, setFromValue] = useState(fromDefaultValue);

  const selectedFromMatch = useMemo(
    () => findOptionMatch(timeOptionGroups, fromValue),
    [fromValue, timeOptionGroups],
  );
  const fromAbsoluteMinutes = selectedFromMatch?.option.absoluteMinutes ?? null;
  const selectedFromGroup = selectedFromMatch?.group ?? null;
  const toDefaultValue = useMemo(() => {
    if (fromAbsoluteMinutes === null || !selectedFromGroup) {
      return "";
    }

    const defaultToMinutes = findOptionAbsoluteMinute(
      [selectedFromGroup],
      safeDefaultTo,
    );

    if (
      defaultToMinutes !== null &&
      defaultToMinutes > fromAbsoluteMinutes &&
      isDurationAllowed(fromAbsoluteMinutes, defaultToMinutes) &&
      !hasIntervalConflict(fromAbsoluteMinutes, defaultToMinutes)
    ) {
      return safeDefaultTo;
    }

    for (const option of selectedFromGroup.options) {
      if (
        option.absoluteMinutes > fromAbsoluteMinutes &&
        isDurationAllowed(fromAbsoluteMinutes, option.absoluteMinutes) &&
        !hasIntervalConflict(fromAbsoluteMinutes, option.absoluteMinutes)
      ) {
        return option.value;
      }
    }

    return "";
  }, [
    fromAbsoluteMinutes,
    hasIntervalConflict,
    safeDefaultTo,
    selectedFromGroup,
  ]);
  const [toValue, setToValue] = useState(toDefaultValue);
  const resolveTimeRange = useCallback(
    (nextFromValue: string, nextToValue: string): ResolvedTimeRange => {
      const fromMatch = findOptionMatch(timeOptionGroups, nextFromValue);

      if (!fromMatch) {
        return {
          from: "",
          to: "",
          durationMinutes: null,
        };
      }

      const fromMinutes = fromMatch.option.absoluteMinutes;
      const toMinutes = findOptionAbsoluteMinute(
        [fromMatch.group],
        nextToValue,
      );

      if (
        toMinutes === null ||
        !isDurationAllowed(fromMinutes, toMinutes) ||
        hasIntervalConflict(fromMinutes, toMinutes)
      ) {
        return {
          from: nextFromValue,
          to: "",
          durationMinutes: null,
        };
      }

      return {
        from: nextFromValue,
        to: nextToValue,
        durationMinutes: toMinutes - fromMinutes,
      };
    },
    [hasIntervalConflict, timeOptionGroups],
  );

  const fromOptionGroups = useMemo(
    () =>
      filterTimeOptionGroups(timeOptionGroups, (option, group) => {
        const groupEndMinutes =
          group.options[group.options.length - 1]?.absoluteMinutes;

        if (
          groupEndMinutes === undefined ||
          groupEndMinutes - option.absoluteMinutes <=
            MIN_ALLOWED_DURATION_MINUTES
        ) {
          return false;
        }

        return group.options.some(
          (endOption) =>
            endOption.absoluteMinutes > option.absoluteMinutes &&
            isDurationAllowed(
              option.absoluteMinutes,
              endOption.absoluteMinutes,
            ) &&
            !hasIntervalConflict(
              option.absoluteMinutes,
              endOption.absoluteMinutes,
            ),
        );
      }),
    [hasIntervalConflict, timeOptionGroups],
  );

  const toOptionGroups = useMemo(() => {
    if (fromAbsoluteMinutes === null || !selectedFromGroup) {
      return [];
    }

    return filterTimeOptionGroups([selectedFromGroup], (option) => {
      if (option.absoluteMinutes <= fromAbsoluteMinutes) {
        return false;
      }

      if (!isDurationAllowed(fromAbsoluteMinutes, option.absoluteMinutes)) {
        return false;
      }

      return !hasIntervalConflict(fromAbsoluteMinutes, option.absoluteMinutes);
    });
  }, [fromAbsoluteMinutes, hasIntervalConflict, selectedFromGroup]);

  const resolvedTimeRange = useMemo(
    () => resolveTimeRange(fromValue, toValue),
    [fromValue, resolveTimeRange, toValue],
  );

  const hasAvailableFromOptions = fromOptionGroups.length > 0;
  const isToDisabled =
    fromAbsoluteMinutes === null || toOptionGroups.length === 0;

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
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            defaultValue={defaults.phone ?? ""}
            placeholder="+54 9 341 310 4099"
            onInput={(event) => {
              const input = event.currentTarget;
              input.value = input.value.replace(/[^\d+\-()\s]/g, "");
            }}
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

      <div className="grid gap-2 sm:grid-cols-2">
        <Field data-invalid={Boolean(fieldErrors.from)}>
          <FieldLabel htmlFor={`${idPrefix}-from`}>From</FieldLabel>
          <FieldContent>
            <input type="hidden" name="from" value={resolvedTimeRange.from} />
            <Select
              value={resolvedTimeRange.from}
              onValueChange={(value) => {
                const nextFromValue = toSafeSelectValue(value);
                setFromValue(nextFromValue);

                const nextRange = resolveTimeRange(nextFromValue, toValue);

                if (nextRange.to !== toValue) {
                  setToValue(nextRange.to);
                }

                onTimeRangeChange?.(nextRange);
              }}
            >
              <SelectTrigger
                id={`${idPrefix}-from`}
                aria-invalid={Boolean(fieldErrors.from)}
                className="w-full"
                disabled={!hasAvailableFromOptions}
              >
                <SelectValue placeholder="Select start time" />
              </SelectTrigger>
              <SelectContent>
                {fromOptionGroups.map((group) => (
                  <SelectGroup key={group.key}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.options.map((option) => (
                      <SelectItem
                        key={`${group.key}-${option.value}`}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{fieldErrors.from}</FieldError>
          </FieldContent>
        </Field>

        <Field data-invalid={Boolean(fieldErrors.to)}>
          <FieldLabel htmlFor={`${idPrefix}-to`}>To</FieldLabel>
          <FieldContent>
            <input type="hidden" name="to" value={resolvedTimeRange.to} />
            <Select
              value={resolvedTimeRange.to}
              onValueChange={(value) => {
                const nextToValue = toSafeSelectValue(value);
                setToValue(nextToValue);
                onTimeRangeChange?.(resolveTimeRange(fromValue, nextToValue));
              }}
              disabled={isToDisabled}
            >
              <SelectTrigger
                id={`${idPrefix}-to`}
                aria-invalid={Boolean(fieldErrors.to)}
                className="w-full"
                disabled={isToDisabled}
              >
                <SelectValue placeholder="Select end time" />
              </SelectTrigger>
              <SelectContent>
                {toOptionGroups.map((group) => (
                  <SelectGroup key={group.key}>
                    <SelectLabel>{group.label}</SelectLabel>
                    {group.options.map((option) => (
                      <SelectItem
                        key={`${group.key}-${option.value}`}
                        value={option.value}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{fieldErrors.to}</FieldError>
          </FieldContent>
        </Field>
      </div>

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
