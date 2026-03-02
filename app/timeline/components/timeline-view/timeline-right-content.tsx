import { DragOverlay, useDroppable } from "@dnd-kit/react";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  GRID_WIDTH_CSS,
  HEADER_HEIGHT_PX,
  ROW_HEIGHT_PX,
} from "@/core/constants";
import { useTimelineZoom } from "@/hooks/use-timeline-zoom";
import { TimelineHoursRow } from "./timeline-hours-row";
import {
  TimelineReservationBlock,
  TimelineReservationOverlayBlock,
} from "./timeline-reservation-block";
import type {
  SelectionReservation,
  SelectionSector,
  SelectionTable,
  TimelineCssVars,
  TimelineDayModel,
} from "./types";
import { useTimelineNowIndicator } from "./use-timeline-now-indicator";
import type {
  MoveValidationReason,
  TimelineReservationDndApi,
} from "./use-timeline-reservation-dnd";
import { getReservationRenderKey, toZoomScaledX } from "./utils";

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

type TimelineTableRowProps = {
  dateKey: string;
  sector: SelectionSector;
  table: SelectionTable;
  reservations: SelectionReservation[];
  timelineStart: TimelineDayModel["timelineStart"];
  timelineEnd: TimelineDayModel["timelineEnd"];
  selectedReservationIds: Set<string>;
  tableById: Map<string, SelectionTable>;
  sectorById: Map<string, SelectionSector>;
  onReservationClick: (reservationKey: string) => void;
  dndApi: TimelineReservationDndApi;
};

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
        <section
          key={day.dateKey}
          className="w-max min-w-full border-b border-slate-200 bg-white last:border-b-0"
        >
          <div className="relative min-w-max" style={{ width: GRID_WIDTH_CSS }}>
            <div
              className="sticky top-0 z-40"
              style={{ width: GRID_WIDTH_CSS }}
            >
              <TimelineHoursRow
                rowKeyPrefix={`${day.dateKey}-slot`}
                zoomPercent={zoomPercent}
                className="backdrop-blur"
              />
            </div>

            <div>
              {day.sectors.map(({ sector, sectorKey, tableRows }) => (
                <Collapsible
                  key={`${day.dateKey}-${sector.id}`}
                  open={isSectorOpen(sectorKey)}
                  onOpenChange={(nextOpen) =>
                    onSectorOpenChange(sectorKey, nextOpen)
                  }
                >
                  <div
                    className="timeline-grid-lines sticky z-30 h-10 border-r border-b border-slate-200 bg-slate-50/95 backdrop-blur"
                    style={{ top: HEADER_HEIGHT_PX }}
                  />

                  <CollapsibleContent>
                    <div>
                      {tableRows.map(({ table, reservations }) => (
                        <TimelineTableRow
                          key={`${day.dateKey}-${table.id}`}
                          dateKey={day.dateKey}
                          sector={sector}
                          table={table}
                          reservations={reservations}
                          timelineStart={day.timelineStart}
                          timelineEnd={day.timelineEnd}
                          selectedReservationIds={selectedReservationIds}
                          tableById={tableById}
                          sectorById={sectorById}
                          onReservationClick={onReservationClick}
                          dndApi={dndApi}
                        />
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        </section>
      ))}

      <DragOverlay dropAnimation={null}>
        {dndApi.preview ? (
          <div className="z-50">
            <TimelineReservationOverlayBlock
              reservation={dndApi.preview.reservation}
              timelineStart={dndApi.preview.timelineStart}
              timelineEnd={dndApi.preview.timelineEnd}
              invalid={!dndApi.preview.valid}
              validationMessage={getDragValidationMessage(
                dndApi.preview.reason,
              )}
            />
          </div>
        ) : null}
      </DragOverlay>
    </div>
  );
}

function TimelineTableRow({
  dateKey,
  sector,
  table,
  reservations,
  timelineStart,
  timelineEnd,
  selectedReservationIds,
  tableById,
  sectorById,
  onReservationClick,
  dndApi,
}: TimelineTableRowProps) {
  const droppable = dndApi.getRowDroppableAttributes(dateKey, table.id);
  const { ref } = useDroppable({
    id: droppable.id,
    data: droppable.data,
  });

  return (
    <div
      ref={ref}
      className="timeline-grid-lines relative border-r border-b border-slate-200"
      style={{ height: ROW_HEIGHT_PX }}
    >
      {reservations.map((reservation) => {
        const reservationKey = getReservationRenderKey(reservation);
        const isSelected = selectedReservationIds.has(reservationKey);
        const draggable = dndApi.getReservationDraggableAttributes(reservation);

        return (
          <TimelineReservationBlock
            key={reservationKey}
            reservation={reservation}
            rowTable={table}
            rowSector={sector}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
            isSelected={isSelected}
            onClick={onReservationClick}
            tableById={tableById}
            sectorById={sectorById}
            dragId={draggable.id}
            dragData={draggable.data}
          />
        );
      })}
    </div>
  );
}

function getDragValidationMessage(reason: MoveValidationReason | undefined) {
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
