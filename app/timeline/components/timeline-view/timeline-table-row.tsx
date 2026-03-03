import { useDroppable } from "@dnd-kit/react";
import { ROW_HEIGHT_PX } from "@/core/constants";
import type { DateKey } from "@/core/types";
import { getDragValidationMessage } from "./drag-validation-message";
import { TimelineCreatePreviewBlock } from "./timeline-create-preview-block";
import { getCreateValidationMessage } from "./timeline-create-validation-message";
import { TimelineReservationBlock } from "./timeline-reservation-block";
import type {
  SelectionReservation,
  SelectionSector,
  SelectionSectorId,
  SelectionTable,
  SelectionTableId,
  TimelineDayModel,
} from "./types";
import type { TimelineReservationCreateApi } from "./use-timeline-reservation-create";
import type { TimelineReservationDndApi } from "./use-timeline-reservation-dnd";
import { getReservationRenderKey } from "./utils";

type TimelineTableRowProps = {
  dateKey: DateKey;
  sector: SelectionSector;
  table: SelectionTable;
  reservations: SelectionReservation[];
  timelineStart: TimelineDayModel["timelineStart"];
  timelineEnd: TimelineDayModel["timelineEnd"];
  selectedReservationIds: Set<string>;
  tableById: Map<SelectionTableId, SelectionTable>;
  sectorById: Map<SelectionSectorId, SelectionSector>;
  onReservationClick: (reservationKey: string) => void;
  dndApi: TimelineReservationDndApi;
  createApi: TimelineReservationCreateApi;
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
  createApi,
}: TimelineTableRowProps) {
  const droppable = dndApi.getRowDroppableAttributes(dateKey, table.id);
  const { ref } = useDroppable({
    id: droppable.id,
    data: droppable.data,
  });
  const rowCreateHandlers = createApi.getRowCreatePointerHandlers({
    dateKey,
    table,
  });
  const createPreview = createApi.getRowCreatePreview(dateKey, table.id);

  return (
    <div
      ref={ref}
      className="timeline-grid-lines relative cursor-crosshair border-r border-b border-slate-200"
      style={{ height: ROW_HEIGHT_PX }}
      {...rowCreateHandlers}
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

      {createPreview ? (
        <TimelineCreatePreviewBlock
          preview={createPreview}
          validationMessage={getCreateValidationMessage(createPreview.reason)}
        />
      ) : null}
    </div>
  );
}
