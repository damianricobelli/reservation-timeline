import { RESERVATION_DRAG_KIND, ROW_DROP_KIND } from "./constants";
import type { ReservationDraggableData, RowDroppableData } from "./types";

/**
 * Builds unique draggable id for dnd-kit registry.
 */
export function getReservationDraggableId(reservationEntityKey: string) {
  return `reservation:${reservationEntityKey}`;
}

/**
 * Builds unique droppable id for dnd-kit registry.
 */
export function getRowDroppableId(dateKey: string, tableId: string) {
  return `row:${dateKey}:${tableId}`;
}

/**
 * Runtime type guard for draggable payload.
 */
export function isReservationDraggableData(
  data: unknown,
): data is ReservationDraggableData {
  if (!data || typeof data !== "object") {
    return false;
  }

  const value = data as Partial<ReservationDraggableData>;
  return (
    value.kind === RESERVATION_DRAG_KIND &&
    typeof value.reservationEntityKey === "string"
  );
}

/**
 * Runtime type guard for row droppable payload.
 */
export function isRowDroppableData(data: unknown): data is RowDroppableData {
  if (!data || typeof data !== "object") {
    return false;
  }

  const value = data as Partial<RowDroppableData>;
  return (
    value.kind === ROW_DROP_KIND &&
    typeof value.dateKey === "string" &&
    typeof value.tableId === "string"
  );
}
