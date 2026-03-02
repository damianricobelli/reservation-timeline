import { useKeyHold } from "@tanstack/react-hotkeys";
import type { PointerEvent } from "react";
import { useState } from "react";

/**
 * State and handlers for sector collapsing and reservation selection behavior.
 */
type TimelineInteractions = {
  selectedReservationKeys: Set<string>;
  isSectorOpen: (sectorKey: string) => boolean;
  setSectorOpen: (sectorKey: string, open: boolean) => void;
  handleReservationClick: (reservationKey: string) => void;
  handleTimelinePointerDown: (event: PointerEvent<HTMLElement>) => void;
};

/**
 * Manages timeline interaction state:
 * - Sector open/closed state via Collapsible keys.
 * - Single and multi-selection of reservations (Cmd/Ctrl click).
 */
export function useTimelineInteractions(): TimelineInteractions {
  const isMetaHold = useKeyHold("Meta");
  const isControlHold = useKeyHold("Control");

  const [sectorOpenState, setSectorOpenState] = useState<Map<string, boolean>>(
    () => new Map(),
  );
  const [selectedReservationKeys, setSelectedReservationKeys] = useState<
    Set<string>
  >(() => new Set());

  const isSectorOpen = (sectorKey: string) => {
    return sectorOpenState.get(sectorKey) ?? true;
  };

  const setSectorOpen = (sectorKey: string, open: boolean) => {
    setSectorOpenState((previous) => {
      const next = new Map(previous);
      next.set(sectorKey, open);
      return next;
    });
  };

  const handleReservationClick = (reservationKey: string) => {
    const isMultiSelect = isMetaHold || isControlHold;

    setSelectedReservationKeys((previous) => {
      if (!isMultiSelect) {
        return new Set([reservationKey]);
      }

      const next = new Set(previous);

      if (next.has(reservationKey)) {
        next.delete(reservationKey);
      } else {
        next.add(reservationKey);
      }

      return next;
    });
  };

  const handleTimelinePointerDown = (event: PointerEvent<HTMLElement>) => {
    const eventTarget = event.target;

    if (!(eventTarget instanceof Element)) {
      return;
    }

    const clickedReservation = eventTarget.closest(
      '[data-reservation-block="true"]',
    );

    if (clickedReservation) {
      return;
    }

    setSelectedReservationKeys(new Set());
  };

  return {
    selectedReservationKeys,
    isSectorOpen,
    setSectorOpen,
    handleReservationClick,
    handleTimelinePointerDown,
  };
}
