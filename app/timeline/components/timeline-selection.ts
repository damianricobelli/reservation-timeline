import dayjs, { type Dayjs } from "dayjs";
import type {
  Reservation,
  ReservationStatus,
  ReservationTimelineRecord,
  Sector,
  Table,
  TimelineConfig,
} from "@/core/types";

type ViewMode = TimelineConfig["viewMode"];
const DATE_FORMAT = "YYYY-MM-DD";

const VIEW_DAYS: Record<ViewMode, number> = {
  day: 1,
  "3-day": 3,
  week: 7,
};

export interface SeedSelectionFilters {
  baseDate?: string | Date | Dayjs;
  fallbackToSeedDate?: boolean;
  sectorIds?: string[];
  tableIds?: string[];
  statuses?: ReservationStatus[];
  reservationIds?: string[];
  search?: string;
}

export interface SeedSelectionResult {
  referenceDate: string;
  dateKeys: string[];
  records: ReservationTimelineRecord[];
  sectors: Sector[];
  tables: Table[];
  reservations: Reservation[];
}

function parseDateInput(dateInput: string | Date | Dayjs | undefined) {
  if (!dateInput) return null;
  const parsed = dayjs(dateInput);
  if (!parsed.isValid()) return null;
  return parsed.startOf("day");
}

function getSortedSeedDates(records: ReservationTimelineRecord[]) {
  return records
    .map((record) => dayjs(record.date))
    .filter((date) => date.isValid())
    .sort((a, b) => a.valueOf() - b.valueOf());
}

function resolveReferenceDate(
  records: ReservationTimelineRecord[],
  filters: Pick<SeedSelectionFilters, "baseDate" | "fallbackToSeedDate">,
) {
  const today = dayjs().startOf("day");
  const explicitDate = parseDateInput(filters.baseDate);

  if (explicitDate) {
    return explicitDate;
  }

  const todayKey = today.format(DATE_FORMAT);
  const hasToday = records.some((record) => record.date === todayKey);

  if (hasToday || filters.fallbackToSeedDate === false) {
    return today;
  }

  const firstSeedDate = getSortedSeedDates(records)[0];
  return firstSeedDate ?? today;
}

function sortSectors(sectors: Sector[]) {
  return sectors.sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });
}

function sortTables(tables: Table[], sectors: Sector[]) {
  const sectorOrder = new Map(
    sectors.map((sector) => [sector.id, sector.sortOrder] as const),
  );

  return tables.sort((a, b) => {
    const aSectorOrder = sectorOrder.get(a.sectorId) ?? Number.MAX_SAFE_INTEGER;
    const bSectorOrder = sectorOrder.get(b.sectorId) ?? Number.MAX_SAFE_INTEGER;

    if (aSectorOrder !== bSectorOrder) return aSectorOrder - bSectorOrder;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name);
  });
}

function toRecordMap<T extends { id: string }>(rows: T[]) {
  const map = new Map<string, T>();

  rows.forEach((row) => {
    if (!map.has(row.id)) {
      map.set(row.id, row);
    }
  });

  return map;
}

function normalizeFilterIds(
  selectedIds: string[] | undefined,
  allIds: string[],
) {
  if (!selectedIds || selectedIds.length === 0 || allIds.length === 0) {
    return [];
  }

  const selectedSet = new Set(selectedIds);
  const normalized = allIds.filter((id) => selectedSet.has(id));

  if (normalized.length === 0 || normalized.length === allIds.length) {
    return [];
  }

  return normalized;
}

export function getViewDateKeys(
  viewMode: ViewMode,
  baseDate: string | Date | Dayjs = dayjs(),
) {
  const anchor = parseDateInput(baseDate) ?? dayjs().startOf("day");
  const days = VIEW_DAYS[viewMode];

  return Array.from({ length: days }, (_, offset) =>
    anchor.add(offset, "day").format(DATE_FORMAT),
  );
}

export function getTimelineRecordsForView(
  records: ReservationTimelineRecord[],
  viewMode: ViewMode,
  filters: Pick<SeedSelectionFilters, "baseDate" | "fallbackToSeedDate"> = {},
) {
  const referenceDate = resolveReferenceDate(records, filters);
  const dateKeys = getViewDateKeys(viewMode, referenceDate);
  const dateSet = new Set(dateKeys);

  return {
    referenceDate: referenceDate.format(DATE_FORMAT),
    dateKeys,
    records: records
      .filter((record) => dateSet.has(record.date))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

export function getSeedSelectionForView(
  timeline: ReservationTimelineRecord[],
  viewMode: ViewMode,
  filters: SeedSelectionFilters = {},
): SeedSelectionResult {
  const { referenceDate, dateKeys, records } = getTimelineRecordsForView(
    timeline,
    viewMode,
    filters,
  );

  const allSectors = records.flatMap((record) => record.sectors);
  const allTables = records.flatMap((record) => record.tables);
  const allReservations = records.flatMap((record) => record.reservations);

  let sectors = Array.from(toRecordMap(allSectors).values());
  let tables = Array.from(toRecordMap(allTables).values());
  let reservations = allReservations;

  const normalizedSectorIds = normalizeFilterIds(
    filters.sectorIds,
    sectors.map((sector) => sector.id),
  );

  if (normalizedSectorIds.length > 0) {
    const sectorSet = new Set(normalizedSectorIds);
    tables = tables.filter((table) => sectorSet.has(table.sectorId));
  }

  const normalizedTableIds = normalizeFilterIds(
    filters.tableIds,
    tables.map((table) => table.id),
  );

  if (normalizedTableIds.length > 0) {
    const tableSet = new Set(normalizedTableIds);
    tables = tables.filter((table) => tableSet.has(table.id));
  }

  const visibleTableIds = new Set(tables.map((table) => table.id));
  reservations = reservations.filter((reservation) =>
    visibleTableIds.has(reservation.tableId),
  );

  if (filters.statuses && filters.statuses.length > 0) {
    const statusSet = new Set(filters.statuses);
    reservations = reservations.filter((reservation) =>
      statusSet.has(reservation.status),
    );
  }

  if (filters.reservationIds && filters.reservationIds.length > 0) {
    const reservationSet = new Set(filters.reservationIds);
    reservations = reservations.filter((reservation) =>
      reservationSet.has(reservation.id),
    );
  }

  const searchTerm = filters.search?.trim().toLowerCase();

  if (searchTerm) {
    reservations = reservations.filter((reservation) => {
      const byName = reservation.customer.name
        .toLowerCase()
        .includes(searchTerm);
      const byPhone = reservation.customer.phone
        .toLowerCase()
        .includes(searchTerm);
      return byName || byPhone;
    });
  }

  const visibleSectorIds = new Set(tables.map((table) => table.sectorId));
  sectors = sectors.filter((sector) => visibleSectorIds.has(sector.id));

  sortSectors(sectors);
  sortTables(tables, sectors);
  reservations.sort(
    (a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf(),
  );

  return {
    referenceDate,
    dateKeys,
    records,
    sectors,
    tables,
    reservations,
  };
}
