import { useTimelineZoom } from "@/hooks/use-timeline-zoom";
import { TimelineDragOverlay } from "./timeline-drag-overlay";
import { TimelineQuickCreateModal } from "./timeline-quick-create-modal";
import { TimelineReservationConfirmModal } from "./timeline-reservation-confirm-modal";
import { TimelineReservationEditModal } from "./timeline-reservation-edit-modal";
import { TimelineRightDaySection } from "./timeline-right-day-section";
import { useTimelineViewContext } from "./timeline-view-providers";
import type { TimelineCssVars, TimelineDayModel } from "./types";
import { useTimelineNowIndicator } from "./use-timeline-now-indicator";
import { toZoomScaledX } from "./utils";

type TimelineRightContentProps = {
  days: TimelineDayModel[];
  timelineCssVars: TimelineCssVars;
};

/**
 * Scrollable timeline grid content for all visible days and tables.
 */
export function TimelineRightContent({
  days,
  timelineCssVars,
}: TimelineRightContentProps) {
  const { zoomPercent } = useTimelineZoom();
  const nowOffsetPx = useTimelineNowIndicator();
  const { rowDelegates, reservationActionsApi } = useTimelineViewContext();

  return (
    <div
      className="timeline-zoom-surface relative w-max min-w-full"
      style={timelineCssVars}
    >
      {typeof nowOffsetPx === "number" ? (
        <div
          className="timeline-now-indicator pointer-events-none absolute inset-y-0 z-40"
          style={{ left: toZoomScaledX(nowOffsetPx) }}
        />
      ) : null}

      {days.map((day) => (
        <TimelineRightDaySection
          key={day.dateKey}
          day={day}
          zoomPercent={zoomPercent}
        />
      ))}

      <TimelineDragOverlay preview={rowDelegates.dndApi.preview} />
      <TimelineQuickCreateModal
        draft={rowDelegates.createApi.draft}
        onClose={rowDelegates.createApi.closeDraft}
        onSubmit={rowDelegates.createApi.submitDraft}
      />
      <TimelineReservationEditModal
        draft={reservationActionsApi.editDraft}
        onClose={reservationActionsApi.closeEditDraft}
        onSubmit={reservationActionsApi.submitEditDraft}
      />
      <TimelineReservationConfirmModal
        draft={reservationActionsApi.confirmationDraft}
        errorMessage={reservationActionsApi.confirmationError}
        pendingAction={reservationActionsApi.pendingAction}
        onClose={reservationActionsApi.closeConfirmationDraft}
        onConfirm={reservationActionsApi.confirmReservationAction}
      />
    </div>
  );
}
