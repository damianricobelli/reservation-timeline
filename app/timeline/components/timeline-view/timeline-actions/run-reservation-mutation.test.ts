import { describe, expect, it, vi } from "vitest";
import { runReservationMutation } from "./run-reservation-mutation";

describe("runReservationMutation", () => {
  it("sets pending before async mutation and clears it after success", async () => {
    const setPendingAction = vi.fn();
    const clearPendingAction = vi.fn();
    const onSuccess = vi.fn();
    const onError = vi.fn();

    let resolveMutate: ((value: { updatedAt: string }) => void) | null = null;
    const mutate = vi.fn(
      () =>
        new Promise<{ updatedAt: string }>((resolve) => {
          resolveMutate = resolve as (value: { updatedAt: string }) => void;
        }),
    );

    const runPromise = runReservationMutation({
      reservationEntityKey: "RES_1-2025-10-14T10:00:00-03:00",
      kind: "edit",
      setPendingAction,
      clearPendingAction,
      mutate,
      onSuccess,
      onError,
    });

    expect(setPendingAction).toHaveBeenCalledTimes(1);
    expect(setPendingAction).toHaveBeenCalledWith({
      reservationEntityKey: "RES_1-2025-10-14T10:00:00-03:00",
      kind: "edit",
    });
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(clearPendingAction).not.toHaveBeenCalled();

    const resolver = resolveMutate as
      | ((value: { updatedAt: string }) => void)
      | null;
    resolver?.({ updatedAt: "2025-10-14T10:10:00-03:00" });
    await runPromise;

    expect(onSuccess).toHaveBeenCalledWith({
      updatedAt: "2025-10-14T10:10:00-03:00",
    });
    expect(onError).not.toHaveBeenCalled();
    expect(clearPendingAction).toHaveBeenCalledTimes(1);
    expect(clearPendingAction).toHaveBeenCalledWith(
      "RES_1-2025-10-14T10:00:00-03:00",
      "edit",
    );
  });

  it("clears pending and forwards errors when mutation fails", async () => {
    const setPendingAction = vi.fn();
    const clearPendingAction = vi.fn();
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const mutationError = new Error("Request failed");
    const mutate = vi.fn(async () => {
      throw mutationError;
    });

    await runReservationMutation({
      reservationEntityKey: "RES_2-2025-10-14T11:00:00-03:00",
      kind: "edit",
      setPendingAction,
      clearPendingAction,
      mutate,
      onSuccess,
      onError,
    });

    expect(setPendingAction).toHaveBeenCalledWith({
      reservationEntityKey: "RES_2-2025-10-14T11:00:00-03:00",
      kind: "edit",
    });
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith(mutationError);
    expect(clearPendingAction).toHaveBeenCalledWith(
      "RES_2-2025-10-14T11:00:00-03:00",
      "edit",
    );
  });
});
