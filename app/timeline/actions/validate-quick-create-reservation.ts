"use server";

import { z } from "zod";
import {
  RESERVATION_PRIORITY_VALUES,
  RESERVATION_STATUS_VALUES,
} from "@/core/types";

const quickCreateReservationSchema = z.object({
  customerName: z.string().trim().min(1, "Customer name is required."),
  phone: z.string().trim().min(1, "Phone is required."),
  partySize: z.coerce
    .number()
    .int("Party size must be an integer.")
    .min(1, "Party size must be at least 1."),
  status: z.enum(RESERVATION_STATUS_VALUES),
  priority: z.enum(RESERVATION_PRIORITY_VALUES),
  from: z.string().trim().min(1, "Start time is required."),
  to: z.string().trim().min(1, "End time is required."),
  notes: z.string().trim().optional(),
});

export type QuickCreateReservationInput = z.infer<
  typeof quickCreateReservationSchema
>;

export type QuickCreateReservationFieldErrors = Partial<
  Record<
    | "customerName"
    | "phone"
    | "partySize"
    | "status"
    | "priority"
    | "from"
    | "to"
    | "notes",
    string
  >
>;

export type QuickCreateReservationActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors: QuickCreateReservationFieldErrors;
  data?: QuickCreateReservationInput;
};

/**
 * Server-side validation for quick-create form payload.
 */
export async function validateQuickCreateReservationAction(
  _previousState: QuickCreateReservationActionState,
  formData: FormData,
): Promise<QuickCreateReservationActionState> {
  const parsed = quickCreateReservationSchema.safeParse({
    customerName: getFormString(formData, "customerName"),
    phone: getFormString(formData, "phone"),
    partySize: getFormString(formData, "partySize"),
    status: getFormStringWithFallback(formData, [
      "reservationStatus",
      "status",
    ]),
    priority: getFormStringWithFallback(formData, [
      "reservationPriority",
      "priority",
    ]),
    from: getFormStringWithFallback(formData, ["from", "reservationFrom"]),
    to: getFormStringWithFallback(formData, ["to", "reservationTo"]),
    notes: getFormString(formData, "notes"),
  });

  if (!parsed.success) {
    const fieldErrors: QuickCreateReservationFieldErrors = {};

    for (const issue of parsed.error.issues) {
      const field = issue.path[0];

      if (
        field === "customerName" ||
        field === "phone" ||
        field === "partySize" ||
        field === "status" ||
        field === "priority" ||
        field === "from" ||
        field === "to" ||
        field === "notes"
      ) {
        fieldErrors[field] = issue.message;
      }
    }

    return {
      status: "error",
      fieldErrors,
      message: "Please correct the highlighted fields.",
    };
  }

  return {
    status: "success",
    fieldErrors: {},
    data: {
      ...parsed.data,
      notes: parsed.data.notes?.trim() || undefined,
    },
  };
}

function getFormString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function getFormStringWithFallback(formData: FormData, names: string[]) {
  for (const name of names) {
    const value = getFormString(formData, name);

    if (value) {
      return value;
    }
  }

  return "";
}
