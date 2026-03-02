import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  GRID_WIDTH_CSS,
  HEADER_HEIGHT_PX,
  ROW_HEIGHT_PX,
} from "@/core/constants";
import { useTimelineZoom } from "@/hooks/use-timeline-zoom";
import { TimelineHoursRow } from "./timeline-hours-row";
import { TimelineReservationBlock } from "./timeline-reservation-block";
import type {
  SelectionSector,
  SelectionTable,
  TimelineCssVars,
  TimelineDayModel,
} from "./types";
import { useTimelineNowIndicator } from "./use-timeline-now-indicator";
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
                        <div
                          key={`${day.dateKey}-${table.id}`}
                          className="timeline-grid-lines relative border-r border-b border-slate-200"
                          style={{ height: ROW_HEIGHT_PX }}
                        >
                          {reservations.map((reservation) => {
                            const reservationKey =
                              getReservationRenderKey(reservation);
                            const isSelected =
                              selectedReservationIds.has(reservationKey);

                            return (
                              <TimelineReservationBlock
                                key={reservationKey}
                                reservation={reservation}
                                rowTable={table}
                                rowSector={sector}
                                timelineStart={day.timelineStart}
                                timelineEnd={day.timelineEnd}
                                isSelected={isSelected}
                                onClick={onReservationClick}
                                tableById={tableById}
                                sectorById={sectorById}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
