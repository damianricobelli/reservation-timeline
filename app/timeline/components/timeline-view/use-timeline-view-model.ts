import dayjs from "dayjs";
import { useMemo } from "react";
import type { SeedSelectionResult } from "../timeline-selection";
import type {
  SelectionSector,
  SelectionSectorId,
  SelectionTable,
  SelectionTableId,
  TimelineDayModel,
} from "./types";
import {
  buildReservationsByDateAndTable,
  getDayReservationCount,
  getTablesBySector,
  getTimelineEndForDate,
  getTimelineStartForDate,
} from "./utils";

/**
 * Derived structures used by the timeline UI for rendering and fast lookups.
 */
type TimelineViewModel = {
  days: TimelineDayModel[];
  tableById: Map<SelectionTableId, SelectionTable>;
  sectorById: Map<SelectionSectorId, SelectionSector>;
};

/**
 * Builds the memoized view model consumed by timeline sections and rows.
 */
export function useTimelineViewModel(
  selection: SeedSelectionResult,
): TimelineViewModel {
  return useMemo(() => {
    const tablesBySector = getTablesBySector(selection.tables);
    const reservationsByDateAndTable = buildReservationsByDateAndTable(
      selection.reservations,
      selection.dateKeys,
    );

    const tableById = new Map(
      selection.tables.map((table) => [table.id, table]),
    );
    const sectorById = new Map(
      selection.sectors.map((sector) => [sector.id, sector]),
    );

    const days: TimelineDayModel[] = selection.dateKeys.map((dateKey) => {
      const reservationsByTable = reservationsByDateAndTable.get(dateKey);

      const sectors = selection.sectors.map((sector) => {
        const sectorTables = tablesBySector.get(sector.id) ?? [];
        const tableRows = sectorTables.map((table) => ({
          table,
          reservations: reservationsByTable?.get(table.id) ?? [],
        }));

        return {
          sector,
          sectorKey: `${dateKey}|${sector.id}`,
          tableRows,
        };
      });

      return {
        dateKey,
        dayLabel: dayjs(dateKey).format("dddd, MMM D"),
        reservationCount: getDayReservationCount(reservationsByTable),
        timelineStart: getTimelineStartForDate(dateKey),
        timelineEnd: getTimelineEndForDate(dateKey),
        sectors,
      };
    });

    return {
      days,
      tableById,
      sectorById,
    };
  }, [selection]);
}
