import { DragOverlay } from "@dnd-kit/react";
import { getDragValidationMessage } from "./drag-validation-message";
import { TimelineReservationOverlayBlock } from "./timeline-reservation-block";
import type { TimelineDragPreview } from "./use-timeline-reservation-dnd";

type TimelineDragOverlayProps = {
  preview: TimelineDragPreview | null;
};

/**
 * Renders the floating reservation preview while a drag operation is active.
 */
export function TimelineDragOverlay({ preview }: TimelineDragOverlayProps) {
  return (
    <DragOverlay dropAnimation={null}>
      {preview ? (
        <div className="z-50">
          <TimelineReservationOverlayBlock
            reservation={preview.reservation}
            timelineStart={preview.timelineStart}
            timelineEnd={preview.timelineEnd}
            invalid={!preview.valid}
            validationMessage={getDragValidationMessage(preview.reason)}
          />
        </div>
      ) : null}
    </DragOverlay>
  );
}
