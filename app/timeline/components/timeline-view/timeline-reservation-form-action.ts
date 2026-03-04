"use client";

import { useActionState } from "react";
import {
  type QuickCreateReservationActionState,
  validateQuickCreateReservationAction,
} from "@/app/timeline/actions/validate-quick-create-reservation";
import type { TimelineReservationEditSubmitInput } from "./timeline-actions/types";
import type { TimelineQuickCreateSubmitInput } from "./timeline-create/types";

type ReservationFormSubmitInput =
  | TimelineQuickCreateSubmitInput
  | TimelineReservationEditSubmitInput;

type ReservationFormSubmitResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
    };

export const INITIAL_RESERVATION_FORM_ACTION_STATE: QuickCreateReservationActionState =
  {
    status: "idle",
    fieldErrors: {},
  };

type UseTimelineReservationFormActionInput = {
  onSubmit: (
    input: ReservationFormSubmitInput,
  ) => Promise<ReservationFormSubmitResult> | ReservationFormSubmitResult;
  onSuccessClose: () => void;
};

/**
 * Shared useActionState flow for reservation form modals.
 */
export function useTimelineReservationFormAction({
  onSubmit,
  onSuccessClose,
}: UseTimelineReservationFormActionInput) {
  return useActionState<QuickCreateReservationActionState, FormData>(
    async (previousState, formData) => {
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

      onSuccessClose();
      return INITIAL_RESERVATION_FORM_ACTION_STATE;
    },
    INITIAL_RESERVATION_FORM_ACTION_STATE,
  );
}
