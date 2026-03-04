import dayjs from "dayjs";
import { useMemo } from "react";
import type { SeedSelectionResult } from "../timeline-selection";
import { getTimelineWindow } from "./domain/timeline-window";
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
    const timezoneByDate = new Map(
      selection.records.map((record) => [
        record.date,
        record.restaurant.timezone,
      ]),
    );
    const timelineWindowsByDate = new Map(
      selection.dateKeys.map((dateKey) => {
        const timezoneName = timezoneByDate.get(dateKey) ?? "UTC";
        return [dateKey, getTimelineWindow(dateKey, timezoneName)];
      }),
    );
    const reservationsByDateAndTable = buildReservationsByDateAndTable(
      selection.reservations,
      selection.dateKeys,
      timelineWindowsByDate,
    );

    const tableById = new Map(
      selection.tables.map((table) => [table.id, table]),
    );
    const sectorById = new Map(
      selection.sectors.map((sector) => [sector.id, sector]),
    );

    const days: TimelineDayModel[] = selection.dateKeys.map((dateKey) => {
      const reservationsByTable = reservationsByDateAndTable.get(dateKey);
      const timelineWindow = timelineWindowsByDate.get(dateKey);
      const fallbackWindow = getTimelineWindow(dateKey, "UTC");

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
        timezoneName: timezoneByDate.get(dateKey) ?? "UTC",
        timelineStart:
          timelineWindow?.timelineStart ?? fallbackWindow.timelineStart,
        timelineEnd: timelineWindow?.timelineEnd ?? fallbackWindow.timelineEnd,
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
