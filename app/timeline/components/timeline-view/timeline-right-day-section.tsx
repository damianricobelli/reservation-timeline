import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { GRID_WIDTH_CSS, HEADER_HEIGHT_PX } from "@/core/constants";
import { TimelineHoursRow } from "./timeline-hours-row";
import { TimelineTableRow } from "./timeline-table-row";
import { useTimelineViewContext } from "./timeline-view-providers";
import type { TimelineDayModel } from "./types";

type TimelineRightDaySectionProps = {
  day: TimelineDayModel;
  zoomPercent: number;
};

/**
 * Renders one day's right-side timeline section (header slots + sector/table rows).
 */
export function TimelineRightDaySection({
  day,
  zoomPercent,
}: TimelineRightDaySectionProps) {
  const { isSectorOpen, onSectorOpenChange } = useTimelineViewContext();

  return (
    <section
      key={day.dateKey}
      className="w-max min-w-full border-b border-slate-200 bg-white last:border-b-0"
    >
      <div className="relative min-w-max" style={{ width: GRID_WIDTH_CSS }}>
        <div className="sticky top-0 z-40" style={{ width: GRID_WIDTH_CSS }}>
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
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </div>
    </section>
  );
}
