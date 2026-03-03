import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import { GRID_WIDTH_CSS, HEADER_HEIGHT_PX } from "@/core/constants";
import type { ReservationStatus } from "@/core/types";
import { TimelineHoursRow } from "./timeline-hours-row";
import { TimelineTableRow } from "./timeline-table-row";
import type {
  SelectionSector,
  SelectionSectorId,
  SelectionTable,
  SelectionTableId,
  TimelineDayModel,
} from "./types";
import type { TimelineReservationCreateApi } from "./use-timeline-reservation-create";
import type { TimelineReservationDndApi } from "./use-timeline-reservation-dnd";

type TimelineRightDaySectionProps = {
  day: TimelineDayModel;
  zoomPercent: number;
  selectedReservationIds: Set<string>;
  tableById: Map<SelectionTableId, SelectionTable>;
  sectorById: Map<SelectionSectorId, SelectionSector>;
  onReservationClick: (reservationKey: string) => void;
  onEditDetails: (reservationEntityKey: string) => void;
  onStatusChange: (
    reservationEntityKey: string,
    nextStatus: ReservationStatus,
  ) => void;
  onMarkNoShow: (reservationEntityKey: string) => void;
  onCancelReservation: (reservationEntityKey: string) => void;
  onDeleteReservation: (reservationEntityKey: string) => void;
  isReservationActionPending: (reservationEntityKey: string) => boolean;
  isSectorOpen: (sectorKey: string) => boolean;
  onSectorOpenChange: (sectorKey: string, open: boolean) => void;
  dndApi: TimelineReservationDndApi;
  createApi: TimelineReservationCreateApi;
};

/**
 * Renders one day's right-side timeline section (header slots + sector/table rows).
 */
export function TimelineRightDaySection({
  day,
  zoomPercent,
  selectedReservationIds,
  tableById,
  sectorById,
  onReservationClick,
  onEditDetails,
  onStatusChange,
  onMarkNoShow,
  onCancelReservation,
  onDeleteReservation,
  isReservationActionPending,
  isSectorOpen,
  onSectorOpenChange,
  dndApi,
  createApi,
}: TimelineRightDaySectionProps) {
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
                      selectedReservationIds={selectedReservationIds}
                      tableById={tableById}
                      sectorById={sectorById}
                      onReservationClick={onReservationClick}
                      onEditDetails={onEditDetails}
                      onStatusChange={onStatusChange}
                      onMarkNoShow={onMarkNoShow}
                      onCancelReservation={onCancelReservation}
                      onDeleteReservation={onDeleteReservation}
                      isReservationActionPending={isReservationActionPending}
                      dndApi={dndApi}
                      createApi={createApi}
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
