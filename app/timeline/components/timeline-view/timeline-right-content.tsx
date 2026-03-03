import { useTimelineZoom } from "@/hooks/use-timeline-zoom";
import { TimelineDragOverlay } from "./timeline-drag-overlay";
import { TimelineRightDaySection } from "./timeline-right-day-section";
import type {
  SelectionSector,
  SelectionTable,
  TimelineCssVars,
  TimelineDayModel,
} from "./types";
import { useTimelineNowIndicator } from "./use-timeline-now-indicator";
import type { TimelineReservationDndApi } from "./use-timeline-reservation-dnd";
import { toZoomScaledX } from "./utils";

type TimelineRightContentProps = {
  days: TimelineDayModel[];
  selectedReservationIds: Set<string>;
  tableById: Map<string, SelectionTable>;
  sectorById: Map<string, SelectionSector>;
  timelineCssVars: TimelineCssVars;
  onReservationClick: (reservationKey: string) => void;
  isSectorOpen: (sectorKey: string) => boolean;
  onSectorOpenChange: (sectorKey: string, open: boolean) => void;
  dndApi: TimelineReservationDndApi;
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
          isSectorOpen={isSectorOpen}
          onSectorOpenChange={onSectorOpenChange}
          dndApi={dndApi}
        />
      ))}

      <TimelineDragOverlay preview={dndApi.preview} />
    </div>
  );
}
