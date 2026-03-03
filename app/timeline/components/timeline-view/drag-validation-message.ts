import type { MoveValidationReason } from "@/core/types";

/**
 * Maps validation reasons to user-facing copy for drag and resize feedback.
 */
export function getDragValidationMessage(
  reason: MoveValidationReason | undefined,
) {
  switch (reason) {
    case "overlap":
      return "Cannot drop here: overlaps another reservation.";
    case "capacity_exceeded":
      return "Cannot drop here: party size exceeds table capacity.";
    case "outside_service_hours":
      return "Cannot drop here: outside service hours.";
    case "outside_timeline":
      return "Cannot drop here: outside timeline hours.";
    default:
      return undefined;
  }
}
