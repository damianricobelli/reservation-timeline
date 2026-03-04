import dayjs from "dayjs";
import type { Dispatch, SetStateAction } from "react";
import { useCallback, useMemo, useState } from "react";
import { MIN_RESERVATION_MINUTES, SLOT_MINUTES } from "@/core/constants";
import type { ReservationTimelineRecord } from "@/core/types";
import { useTimelineQueryState } from "@/hooks/use-timeline-query-state";
import { getCreateValidationMessage } from "../timeline-create-validation-message";
import { appendReservation } from "../timeline-dnd/records";
import { buildReservationId } from "./preview";
import type {
  TimelineCreateCommitDraft,
  TimelineCreateDraft,
  TimelineQuickCreateSubmitInput,
  TimelineQuickCreateSubmitResult,
} from "./types";
import { getCreateValidationReason } from "./validation";

const CREATE_MAX_DURATION_MINUTES = 6 * 60;

type UseCreateDraftInput = {
  records: ReservationTimelineRecord[];
  setRecords: Dispatch<SetStateAction<ReservationTimelineRecord[]>>;
};

type UseCreateDraftResult = {
  draft: TimelineCreateDraft | null;
  closeDraft: () => void;
  queueOpenDraft: (draft: TimelineCreateCommitDraft) => void;
  submitDraft: (
    input: TimelineQuickCreateSubmitInput,
  ) => TimelineQuickCreateSubmitResult;
};

export function useCreateDraft({
  records,
  setRecords,
}: UseCreateDraftInput): UseCreateDraftResult {
  const [draftState, setDraftState] =
    useState<TimelineCreateCommitDraft | null>(null);
  const [statusFilters, setStatusFilters] = useTimelineQueryState("status");

  const closeDraft = useCallback(() => {
    setDraftState(null);
  }, []);

  /**
   * Defers draft opening so the same pointer interaction cannot instantly close it.
   */
  const queueOpenDraft = useCallback((draft: TimelineCreateCommitDraft) => {
    setTimeout(() => {
      setDraftState(draft);
    }, 0);
  }, []);

  const submitDraft = useCallback(
    (
      input: TimelineQuickCreateSubmitInput,
    ): TimelineQuickCreateSubmitResult => {
      if (!draftState) {
        return {
          ok: false,
          message: "Unable to create reservation: no active draft.",
        };
      }

      const customerName = input.customerName.trim();
      const phone = input.phone.trim();
      const notes = input.notes?.trim();
      const partySize = input.partySize;
      const startTime = mergeTimeIntoIsoDate(
        draftState.reservation.startTime,
        input.from,
      );
      let endTime = mergeTimeIntoIsoDate(
        draftState.reservation.startTime,
        input.to,
      );

      if (!endTime.isAfter(startTime)) {
        endTime = endTime.add(1, "day");
      }

      const durationMinutes = endTime.diff(startTime, "minute");

      if (!customerName || !phone) {
        return {
          ok: false,
          message: "Customer name and phone are required.",
        };
      }

      if (
        durationMinutes < MIN_RESERVATION_MINUTES ||
        durationMinutes > CREATE_MAX_DURATION_MINUTES ||
        durationMinutes % SLOT_MINUTES !== 0
      ) {
        return {
          ok: false,
          message:
            "Duration must be between 30 and 360 minutes in 15-minute slots.",
        };
      }

      const targetRecord = records.find(
        (record) => record.date === draftState.dateKey,
      );

      if (!targetRecord) {
        return {
          ok: false,
          message:
            "Timeline data changed while creating this reservation. Please try again.",
        };
      }
      const candidate = {
        ...draftState.reservation,
        customer: {
          name: customerName,
          phone,
        },
        partySize,
        durationMinutes,
        startTime: startTime.format(),
        endTime: endTime.format(),
        status: input.status,
        priority: input.priority,
        notes: notes || undefined,
      };
      const reason = getCreateValidationReason({
        candidate,
        targetDateKey: draftState.dateKey,
        targetTable: draftState.table,
        targetRecord,
      });

      if (reason) {
        return {
          ok: false,
          reason,
          message:
            getCreateValidationMessage(reason) ??
            "Cannot create reservation with current values.",
        };
      }

      const nowIso = dayjs().format();
      const committedReservation = {
        ...candidate,
        id: buildReservationId(),
        createdAt: nowIso,
        updatedAt: nowIso,
        source: "walkin" as const,
      };

      if (!statusFilters.includes(input.status)) {
        setStatusFilters((previous) => {
          if (previous.includes(input.status)) {
            return previous;
          }

          return [...previous, input.status];
        });
      }

      setRecords((previous) =>
        appendReservation(previous, draftState.dateKey, committedReservation),
      );
      closeDraft();
      return { ok: true };
    },
    [
      closeDraft,
      draftState,
      records,
      setRecords,
      setStatusFilters,
      statusFilters,
    ],
  );

  const draft = useMemo<TimelineCreateDraft | null>(() => {
    if (!draftState) {
      return null;
    }

    return {
      dateKey: draftState.dateKey,
      table: draftState.table,
      serviceHours: draftState.targetRecord.restaurant.serviceHours,
      occupiedTimeRanges: draftState.targetRecord.reservations
        .filter((reservation) => reservation.tableId === draftState.table.id)
        .map((reservation) => ({
          start: dayjs(reservation.startTime).format("HH:mm"),
          end: dayjs(reservation.endTime).format("HH:mm"),
        })),
      reservation: draftState.reservation,
    };
  }, [draftState]);

  return {
    draft,
    closeDraft,
    queueOpenDraft,
    submitDraft,
  };
}

function mergeTimeIntoIsoDate(baseIsoDate: string, time: string) {
  const [hourPart, minutePart] = time.split(":");
  const hours = Number.parseInt(hourPart ?? "0", 10);
  const minutes = Number.parseInt(minutePart ?? "0", 10);

  return dayjs(baseIsoDate)
    .hour(Number.isNaN(hours) ? 0 : hours)
    .minute(Number.isNaN(minutes) ? 0 : minutes)
    .second(0)
    .millisecond(0);
}
