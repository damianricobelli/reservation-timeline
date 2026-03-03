import type { MoveValidationReason } from "./timeline-dnd/types";

export type TimelineCreateValidationReason =
  | MoveValidationReason
  | "duration_too_short"
  | "duration_too_long";

/**
 * Maps create-flow validation reasons to user-facing error copy.
 */
export function getCreateValidationMessage(
  reason: TimelineCreateValidationReason | undefined,
) {
  switch (reason) {
    case "overlap":
      return "Cannot create here: overlaps another reservation.";
    case "capacity_exceeded":
      return "Cannot create here: party size exceeds table capacity.";
    case "outside_service_hours":
      return "Cannot create here: outside service hours.";
    case "outside_timeline":
      return "Cannot create here: outside timeline hours.";
    case "duration_too_short":
      return "Duration must be at least 30 minutes.";
    case "duration_too_long":
      return "Duration cannot exceed 6 hours.";
    default:
      return undefined;
  }
}
