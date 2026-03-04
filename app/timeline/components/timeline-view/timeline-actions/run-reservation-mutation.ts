import type { Dispatch } from "react";
import type {
  PendingReservationAction,
  PendingReservationActionKind,
} from "./state";

type RunReservationMutationInput<TData> = {
  reservationEntityKey: string;
  kind: PendingReservationActionKind;
  setPendingAction: Dispatch<PendingReservationAction>;
  clearPendingAction: (
    reservationEntityKey: string,
    kind: PendingReservationActionKind,
  ) => void;
  mutate: () => Promise<TData>;
  onSuccess: (data: TData) => void;
  onError?: (error: unknown) => void;
};

/**
 * Shared async mutation flow for reservation operations.
 * It handles pending lifecycle and leaves domain updates to callbacks.
 */
export async function runReservationMutation<TData>({
  reservationEntityKey,
  kind,
  setPendingAction,
  clearPendingAction,
  mutate,
  onSuccess,
  onError,
}: RunReservationMutationInput<TData>) {
  setPendingAction({
    reservationEntityKey,
    kind,
  });

  try {
    const data = await mutate();
    onSuccess(data);
  } catch (error) {
    onError?.(error);
  } finally {
    clearPendingAction(reservationEntityKey, kind);
  }
}
