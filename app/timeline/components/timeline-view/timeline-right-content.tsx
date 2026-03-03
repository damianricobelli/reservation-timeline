import { useTimelineZoom } from "@/hooks/use-timeline-zoom";
import { TimelineDragOverlay } from "./timeline-drag-overlay";
import { TimelineQuickCreateModal } from "./timeline-quick-create-modal";
import { TimelineReservationConfirmModal } from "./timeline-reservation-confirm-modal";
import { TimelineReservationEditModal } from "./timeline-reservation-edit-modal";
import { TimelineRightDaySection } from "./timeline-right-day-section";
import type {
  SelectionSector,
  SelectionSectorId,
  SelectionTable,
  SelectionTableId,
  TimelineCssVars,
  TimelineDayModel,
} from "./types";
import { useTimelineNowIndicator } from "./use-timeline-now-indicator";
import type { TimelineReservationActionsApi } from "./use-timeline-reservation-actions";
import type { TimelineReservationCreateApi } from "./use-timeline-reservation-create";
import type { TimelineReservationDndApi } from "./use-timeline-reservation-dnd";
import { toZoomScaledX } from "./utils";

type TimelineRightContentProps = {
  days: TimelineDayModel[];
  selectedReservationIds: Set<string>;
  tableById: Map<SelectionTableId, SelectionTable>;
  sectorById: Map<SelectionSectorId, SelectionSector>;
  timelineCssVars: TimelineCssVars;
  onReservationClick: (reservationKey: string) => void;
  isSectorOpen: (sectorKey: string) => boolean;
  onSectorOpenChange: (sectorKey: string, open: boolean) => void;
  dndApi: TimelineReservationDndApi;
  createApi: TimelineReservationCreateApi;
  reservationActionsApi: TimelineReservationActionsApi;
};

/**
 * Scrollable timeline grid content for all visible days and tables.
 */
export function TimelineRightContent({
  days,
  selectedReservationIds,
  tableById,
  sectorById,
  timelineCssVars,
  onReservationClick,
  isSectorOpen,
  onSectorOpenChange,
  dndApi,
  createApi,
  reservationActionsApi,
}: TimelineRightContentProps) {
  const { zoomPercent } = useTimelineZoom();
  const nowOffsetPx = useTimelineNowIndicator();

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
          selectedReservationIds={selectedReservationIds}
          tableById={tableById}
          sectorById={sectorById}
          onReservationClick={onReservationClick}
          onEditDetails={reservationActionsApi.openEditDraft}
          onStatusChange={reservationActionsApi.updateReservationStatus}
          onMarkNoShow={reservationActionsApi.markReservationNoShow}
          onCancelReservation={reservationActionsApi.requestCancelReservation}
          onDeleteReservation={reservationActionsApi.requestDeleteReservation}
          isReservationActionPending={reservationActionsApi.isReservationBusy}
          isSectorOpen={isSectorOpen}
          onSectorOpenChange={onSectorOpenChange}
          dndApi={dndApi}
          createApi={createApi}
        />
      ))}

      <TimelineDragOverlay preview={dndApi.preview} />
      <TimelineQuickCreateModal
        draft={createApi.draft}
        onClose={createApi.closeDraft}
        onSubmit={createApi.submitDraft}
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
