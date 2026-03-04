import type { Dayjs } from "dayjs";
import type {
  Dispatch,
  PointerEvent as ReactPointerEvent,
  RefObject,
  SetStateAction,
} from "react";
import type {
  DateKey,
  ReservationTimelineRecord,
  ServiceHour,
  TableId,
} from "@/core/types";
import type { SelectionReservation, SelectionTable } from "../types";
import type { TimelineCreateValidationReason } from "./validation";

export type TimelineCreateCommitDraft = {
  dateKey: DateKey;
  table: SelectionTable;
  targetRecord: ReservationTimelineRecord;
  reservation: SelectionReservation;
};

export type ActiveCreateState = {
  dateKey: DateKey;
  table: SelectionTable;
  targetRecord: ReservationTimelineRecord;
  timelineStart: Dayjs;
  timelineEnd: Dayjs;
  pointerId: number;
  originClientX: number;
  originScrollLeft: number;
  pointerClientX: number;
  sourceOffsetMinutes: number;
  preview: TimelineCreatePreview;
};

export type TimelineCreateDraft = {
  dateKey: DateKey;
  table: SelectionTable;
  serviceHours: ServiceHour[];
  occupiedTimeRanges: { start: string; end: string }[];
  reservation: SelectionReservation;
};

export type TimelineCreatePreview = {
  reservation: SelectionReservation;
  timelineStart: Dayjs;
  timelineEnd: Dayjs;
  dateKey: DateKey;
  table: SelectionTable;
  valid: boolean;
  reason?: TimelineCreateValidationReason;
};

export type TimelineQuickCreateSubmitInput = {
  customerName: string;
  phone: string;
  partySize: number;
  status: SelectionReservation["status"];
  priority: SelectionReservation["priority"];
  from: string;
  to: string;
  notes?: string;
};

export type TimelineQuickCreateSubmitResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason?: TimelineCreateValidationReason;
      message: string;
    };

export type RowCreatePointerHandlers = {
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onLostPointerCapture: (event: ReactPointerEvent<HTMLDivElement>) => void;
};

export type GetRowCreatePointerHandlersInput = {
  dateKey: DateKey;
  table: SelectionTable;
};

export type UseTimelineReservationCreateInput = {
  records: ReservationTimelineRecord[];
  setRecords: Dispatch<SetStateAction<ReservationTimelineRecord[]>>;
  zoomPercent: number;
  rightViewportRef: RefObject<HTMLDivElement | null>;
};

export type TimelineReservationCreateApi = {
  getRowCreatePointerHandlers: (
    input: GetRowCreatePointerHandlersInput,
  ) => RowCreatePointerHandlers;
  getRowCreatePreview: (
    dateKey: DateKey,
    tableId: TableId,
  ) => TimelineCreatePreview | null;
  draft: TimelineCreateDraft | null;
  closeDraft: () => void;
  submitDraft: (
    input: TimelineQuickCreateSubmitInput,
  ) => TimelineQuickCreateSubmitResult;
};
