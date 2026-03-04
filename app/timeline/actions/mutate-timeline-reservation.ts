"use server";

import dayjs from "dayjs";
import { z } from "zod";
import {
  RESERVATION_PRIORITY_VALUES,
  RESERVATION_STATUS_VALUES,
} from "@/core/types";

const reservationIdSchema = z.string().trim().min(1);

const updateStatusSchema = z.object({
  reservationId: reservationIdSchema,
  nextStatus: z.enum(RESERVATION_STATUS_VALUES),
});

const updateDetailsSchema = z.object({
  reservationId: reservationIdSchema,
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

const deleteReservationSchema = z.object({
  reservationId: reservationIdSchema,
});

const cancelReservationSchema = z.object({
  reservationId: reservationIdSchema,
});

type ActionFailure = {
  ok: false;
  message: string;
};

type ActionSuccess<TData> = {
  ok: true;
  data: TData;
};

type ActionResult<TData> = ActionSuccess<TData> | ActionFailure;

export async function updateTimelineReservationStatusAction(input: {
  reservationId: string;
  nextStatus: (typeof RESERVATION_STATUS_VALUES)[number];
}): Promise<
  ActionResult<{
    reservationId: string;
    nextStatus: (typeof RESERVATION_STATUS_VALUES)[number];
    updatedAt: string;
  }>
> {
  const parsed = updateStatusSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid status change payload.",
    };
  }

  return {
    ok: true,
    data: {
      reservationId: parsed.data.reservationId,
      nextStatus: parsed.data.nextStatus,
      updatedAt: dayjs().format(),
    },
  };
}

export type TimelineReservationDetailsInput = z.infer<
  typeof updateDetailsSchema
>;

export async function updateTimelineReservationDetailsAction(
  input: TimelineReservationDetailsInput,
): Promise<
  ActionResult<{
    reservationId: string;
    customerName: string;
    phone: string;
    partySize: number;
    status: (typeof RESERVATION_STATUS_VALUES)[number];
    priority: (typeof RESERVATION_PRIORITY_VALUES)[number];
    from: string;
    to: string;
    notes?: string;
    updatedAt: string;
  }>
> {
  const parsed = updateDetailsSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid reservation details payload.",
    };
  }

  return {
    ok: true,
    data: {
      reservationId: parsed.data.reservationId,
      customerName: parsed.data.customerName,
      phone: parsed.data.phone,
      partySize: parsed.data.partySize,
      status: parsed.data.status,
      priority: parsed.data.priority,
      from: parsed.data.from,
      to: parsed.data.to,
      notes: parsed.data.notes?.trim() || undefined,
      updatedAt: dayjs().format(),
    },
  };
}

export async function cancelTimelineReservationAction(input: {
  reservationId: string;
}): Promise<
  ActionResult<{
    reservationId: string;
    nextStatus: "CANCELLED";
    updatedAt: string;
  }>
> {
  const parsed = cancelReservationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid cancellation payload.",
    };
  }

  return {
    ok: true,
    data: {
      reservationId: parsed.data.reservationId,
      nextStatus: "CANCELLED",
      updatedAt: dayjs().format(),
    },
  };
}

export async function deleteTimelineReservationAction(input: {
  reservationId: string;
}): Promise<
  ActionResult<{
    reservationId: string;
    deletedAt: string;
  }>
> {
  const parsed = deleteReservationSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid delete payload.",
    };
  }

  return {
    ok: true,
    data: {
      reservationId: parsed.data.reservationId,
      deletedAt: dayjs().format(),
    },
  };
}
