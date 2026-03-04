import type { Dayjs } from "dayjs";
import type { CSSProperties } from "react";
import type { DateKey } from "@/core/types";
import type { SeedSelectionResult } from "../timeline-selection";

export type SelectionTable = SeedSelectionResult["tables"][number];
export type SelectionReservation = SeedSelectionResult["reservations"][number];
export type SelectionSector = SeedSelectionResult["sectors"][number];
export type SelectionSectorId = SelectionTable["sectorId"];
export type SelectionTableId = SelectionTable["id"];

export type ReservationsByTable = Map<SelectionTableId, SelectionReservation[]>;

export type ReservationsByDateAndTable = Map<DateKey, ReservationsByTable>;
export type TablesBySector = Map<
  SelectionSectorId,
  SeedSelectionResult["tables"]
>;

export type TimelineTableRowModel = {
  table: SelectionTable;
  reservations: SelectionReservation[];
};

export type TimelineSectorModel = {
  sector: SelectionSector;
  sectorKey: string;
  tableRows: TimelineTableRowModel[];
};

export type TimelineDayModel = {
  dateKey: DateKey;
  dayLabel: string;
  reservationCount: number;
  timezoneName: string;
  timelineStart: Dayjs;
  timelineEnd: Dayjs;
  sectors: TimelineSectorModel[];
};

export type TimelineCssVars = CSSProperties & {
  "--timeline-zoom": string;
  "--timeline-slot-width-base": string;
};
