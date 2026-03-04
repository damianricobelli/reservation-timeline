import { useDroppable } from "@dnd-kit/react";
import { ROW_HEIGHT_PX } from "@/core/constants";
import type { DateKey } from "@/core/types";
import { getDragValidationMessage } from "./drag-validation-message";
import { TimelineCreatePreviewBlock } from "./timeline-create-preview-block";
import { getCreateValidationMessage } from "./timeline-create-validation-message";
import { TimelineReservationBlock } from "./timeline-reservation-block";
import type { TimelineRowDelegates } from "./timeline-row-delegates";
import type {
  SelectionReservation,
  SelectionSector,
  SelectionTable,
  TimelineDayModel,
} from "./types";
import { getReservationEntityKey, getReservationRenderKey } from "./utils";

type TimelineTableRowProps = {
  dateKey: DateKey;
  sector: SelectionSector;
  table: SelectionTable;
  reservations: SelectionReservation[];
  timelineStart: TimelineDayModel["timelineStart"];
  timelineEnd: TimelineDayModel["timelineEnd"];
  selectedReservationIds: Set<string>;
  rowDelegates: TimelineRowDelegates;
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
  rowDelegates,
}: TimelineTableRowProps) {
  const { dndApi, createApi } = rowDelegates;
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
        const reservationEntityKey = getReservationEntityKey(reservation);
        const isSelected = selectedReservationIds.has(reservationKey);
        const actionPending =
          rowDelegates.isReservationActionPending(reservationEntityKey);
        const draggable = dndApi.getReservationDraggableAttributes(reservation);
        const resizePreview = dndApi.getResizePreview(reservation);
        const blockReservation = resizePreview?.reservation ?? reservation;

        return (
          <TimelineReservationBlock
            key={reservationKey}
            reservation={blockReservation}
            reservationKey={reservationKey}
            reservationEntityKey={reservationEntityKey}
            tableName={table.name}
            sectorName={sector.name}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
            isSelected={isSelected}
            actionPending={actionPending}
            onClick={rowDelegates.onReservationClick}
            onEditDetails={rowDelegates.onEditDetails}
            onStatusChange={rowDelegates.onStatusChange}
            onMarkNoShow={rowDelegates.onMarkNoShow}
            onCancelReservation={rowDelegates.onCancelReservation}
            onDeleteReservation={rowDelegates.onDeleteReservation}
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
