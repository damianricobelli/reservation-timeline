import type { DragDropEventHandlers } from "@dnd-kit/react";
import type { Dayjs } from "dayjs";
import type {
  Dispatch,
  PointerEvent as ReactPointerEvent,
  SetStateAction,
} from "react";
import type {
  DateKey,
  MoveValidationReason,
  ReservationTimelineRecord,
  TableId,
} from "@/core/types";
import type { SelectionReservation, SelectionTable } from "../types";
import type { RESERVATION_DRAG_KIND, ROW_DROP_KIND } from "./constants";

/**
 * Data payload attached to each draggable reservation block.
 */
export type ReservationDraggableData = {
  kind: typeof RESERVATION_DRAG_KIND;
  reservationEntityKey: string;
};

/**
 * Data payload attached to each droppable timeline row (date + table).
 */
export type RowDroppableData = {
  kind: typeof ROW_DROP_KIND;
  dateKey: DateKey;
  tableId: TableId;
};

/**
 * Logical target row used during drag operation preview and commit.
 */
export type RowTarget = {
  dateKey: DateKey;
  tableId: TableId;
};

/**
 * Resize edge identifier for reservation duration editing.
 */
export type ResizeEdge = "start" | "end";

/**
 * Preview model used by both drag move and resize interactions.
 */
export type TimelineDragPreview = {
  reservation: SelectionReservation;
  timelineStart: Dayjs;
  timelineEnd: Dayjs;
  valid: boolean;
  reason?: MoveValidationReason;
};

/**
 * Internal state while a drag move is active.
 */
export type ActiveDragState = {
  reservationEntityKey: string;
  sourceReservation: SelectionReservation;
  sourceOffsetMinutes: number;
  target: RowTarget;
  preview: TimelineDragPreview;
};

/**
 * Internal state while a resize interaction is active.
 */
export type ActiveResizeState = {
  reservationEntityKey: string;
  pointerId: number;
  edge: ResizeEdge;
  originClientX: number;
  sourceReservation: SelectionReservation;
  targetDateKey: DateKey;
  targetTable: SelectionTable;
  targetRecord: ReservationTimelineRecord;
  timelineStart: Dayjs;
  timelineEnd: Dayjs;
  preview: TimelineDragPreview;
};

/**
 * Thin operation model extracted from dnd-kit events.
 */
export type TimelineDragOperation = {
  target: {
    data?: unknown;
  } | null;
  transform: {
    x: number;
  };
};

/**
 * Hook inputs supplied by the timeline view orchestrator.
 */
export type UseTimelineReservationDndInput = {
  records: ReservationTimelineRecord[];
  setRecords: Dispatch<SetStateAction<ReservationTimelineRecord[]>>;
  tableById: Map<string, SelectionTable>;
  zoomPercent: number;
};

/**
 * Draggable registration attributes for reservation blocks.
 */
export type DraggableAttributes = {
  id: string;
  data: ReservationDraggableData;
};

/**
 * Droppable registration attributes for table rows.
 */
export type DroppableAttributes = {
  id: string;
  data: RowDroppableData;
};

/**
 * Pointer handlers bound to left/right resize handles.
 */
export type ResizeHandleProps = {
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onLostPointerCapture: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

/**
 * dnd-kit provider handlers consumed by DragDropProvider.
 */
export type ProviderHandlers = Pick<
  DragDropEventHandlers,
  "onDragStart" | "onDragMove" | "onDragOver" | "onDragEnd"
>;

/**
 * Public API exposed to timeline UI components.
 */
export type TimelineReservationDndApi = {
  providerHandlers: ProviderHandlers;
  preview: TimelineDragPreview | null;
  getReservationDraggableAttributes: (
    reservation: SelectionReservation,
  ) => DraggableAttributes;
  getRowDroppableAttributes: (
    dateKey: DateKey,
    tableId: TableId,
  ) => DroppableAttributes;
  getResizeHandleProps: (
    reservation: SelectionReservation,
    edge: ResizeEdge,
  ) => ResizeHandleProps;
  getResizePreview: (
    reservation: SelectionReservation,
  ) => TimelineDragPreview | null;
};
