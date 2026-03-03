import { useDroppable } from "@dnd-kit/react";
import { ROW_HEIGHT_PX } from "@/core/constants";
import { getDragValidationMessage } from "./drag-validation-message";
import { TimelineReservationBlock } from "./timeline-reservation-block";
import type {
  SelectionReservation,
  SelectionSector,
  SelectionTable,
  TimelineDayModel,
} from "./types";
import type { TimelineReservationDndApi } from "./use-timeline-reservation-dnd";
import { getReservationRenderKey } from "./utils";

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

/**
 * Single droppable row for one table/date intersection and all its reservations.
 */
export function TimelineTableRow({
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
        const resizePreview = dndApi.getResizePreview(reservation);
        const blockReservation = resizePreview?.reservation ?? reservation;

        return (
          <TimelineReservationBlock
            key={reservationKey}
            reservation={blockReservation}
            reservationKey={reservationKey}
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
            resizeStartHandleProps={dndApi.getResizeHandleProps(
              reservation,
              "start",
            )}
            resizeEndHandleProps={dndApi.getResizeHandleProps(
              reservation,
              "end",
            )}
            invalid={Boolean(resizePreview && !resizePreview.valid)}
            validationMessage={
              resizePreview && !resizePreview.valid
                ? getDragValidationMessage(resizePreview.reason)
                : undefined
            }
          />
        );
      })}
    </div>
  );
}
