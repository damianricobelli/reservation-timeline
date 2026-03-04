import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { SLOT_MINUTES } from "@/core/constants";
import { getServiceHourWindows } from "@/core/service-hours";
import type {
  Reservation,
  ReservationPriority,
  ReservationTimelineRecord,
  Restaurant,
  Sector,
  ServiceHour,
  Table,
} from "@/core/types";
import {
  DATE_KEY_FORMAT,
  RESERVATION_SOURCE_VALUES,
  RESERVATION_STATUS_VALUES,
} from "@/core/types";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "America/Argentina/Buenos_Aires";

const RESTAURANT_NAMES = [
  "Bistro Central",
  "La Esquina",
  "Puerto Norte",
  "Casa Brava",
  "El Molino",
];

const SECTOR_TEMPLATES: Omit<Sector, "id">[] = [
  { name: "Main Hall", color: "#3B82F6", sortOrder: 0 },
  { name: "Terrace", color: "#10B981", sortOrder: 1 },
  { name: "Bar", color: "#F59E0B", sortOrder: 2 },
];

const TABLE_TEMPLATES: Omit<Table, "id" | "sectorId">[] = [
  { name: "Table 1", capacity: { min: 2, max: 2 }, sortOrder: 0 },
  { name: "Table 2", capacity: { min: 2, max: 4 }, sortOrder: 1 },
  { name: "Table 3", capacity: { min: 4, max: 6 }, sortOrder: 2 },
  { name: "Table 4", capacity: { min: 2, max: 4 }, sortOrder: 0 },
  { name: "Table 5", capacity: { min: 4, max: 8 }, sortOrder: 1 },
  { name: "Table 6", capacity: { min: 2, max: 10 }, sortOrder: 2 },
];

const FIRST_NAMES = [
  "John",
  "Jane",
  "Juan",
  "Mariana",
  "Pedro",
  "Carla",
  "Lucas",
  "Sofia",
  "Diego",
  "Camila",
];

const LAST_NAMES = [
  "Doe",
  "Smith",
  "Perez",
  "Gonzalez",
  "Rodriguez",
  "Fernandez",
  "Lopez",
  "Martinez",
];

const NOTES = [
  "Birthday celebration",
  "Anniversary dinner",
  "Needs high chair",
  "Window table requested",
  "Gluten free menu",
];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function buildRestaurant(index: number): Restaurant {
  return {
    id: `R${index + 1}`,
    name: randomItem(RESTAURANT_NAMES),
    timezone: DEFAULT_TIMEZONE,
    serviceHours: [
      { start: "12:00", end: "16:00" },
      { start: "20:00", end: "00:00" },
    ],
  };
}

function buildSectors(): Sector[] {
  return SECTOR_TEMPLATES.map((sector, index) => ({
    ...sector,
    id: `S${index + 1}`,
  }));
}

function buildTables(sectors: Sector[]): Table[] {
  return TABLE_TEMPLATES.map((table, index) => {
    const sector = sectors[index < 3 ? 0 : index < 5 ? 1 : 2] ?? sectors[0];
    return {
      ...table,
      id: `T${index + 1}`,
      sectorId: sector.id,
    };
  });
}

function buildDate(index: number) {
  return dayjs().add(index, "day").format(DATE_KEY_FORMAT);
}

function randomStartWithinServiceHours(
  date: string,
  timezoneName: string,
  serviceHours: ServiceHour[],
  durationMinutes: number,
) {
  const windows = getServiceHourWindows(date, serviceHours, timezoneName);
  const viableWindows = windows.filter(
    ({ start, end }) => end.diff(start, "minute") >= durationMinutes,
  );

  if (viableWindows.length === 0) {
    return null;
  }

  const chosenWindow = randomItem(viableWindows);
  const maxStartOffsetMinutes =
    chosenWindow.end.diff(chosenWindow.start, "minute") - durationMinutes;
  const maxStartOffsetSlots = Math.floor(maxStartOffsetMinutes / SLOT_MINUTES);
  const startOffsetSlots = randomInt(0, maxStartOffsetSlots);

  return chosenWindow.start.add(startOffsetSlots * SLOT_MINUTES, "minute");
}

function hasOverlap(
  nextStart: dayjs.Dayjs,
  nextEnd: dayjs.Dayjs,
  existing: Reservation[],
) {
  return existing.some((reservation) => {
    const start = dayjs(reservation.startTime);
    const end = dayjs(reservation.endTime);
    return nextStart.isBefore(end) && nextEnd.isAfter(start);
  });
}

function buildReservation(
  date: string,
  timezoneName: string,
  serviceHours: ServiceHour[],
  table: Table,
  reservationId: string,
  existingForTable: Reservation[],
): Reservation | null {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const durationMinutes = randomItem([60, 75, 90, 105, 120, 135]);
    const start = randomStartWithinServiceHours(
      date,
      timezoneName,
      serviceHours,
      durationMinutes,
    );

    if (start === null) {
      return null;
    }

    const end = start.add(durationMinutes, "minute");

    if (hasOverlap(start, end, existingForTable)) {
      continue;
    }

    const partySize = randomInt(table.capacity.min, table.capacity.max);
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);
    const status: Reservation["status"] = randomItem(RESERVATION_STATUS_VALUES);
    const priorityPool: readonly ReservationPriority[] =
      partySize >= 6 ? ["VIP", "LARGE_GROUP"] : ["STANDARD", "VIP"];
    const priority: Reservation["priority"] = randomItem(priorityPool);

    const createdAt = start.subtract(randomInt(1, 72), "hour");
    const updatedAt = createdAt.add(randomInt(0, 8), "hour");

    return {
      id: reservationId,
      tableId: table.id,
      customer: {
        name: `${firstName} ${lastName}`,
        phone: `+54 9 11 ${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 99)}@example.com`,
      },
      partySize,
      startTime: start.format("YYYY-MM-DDTHH:mm:ssZ"),
      endTime: end.format("YYYY-MM-DDTHH:mm:ssZ"),
      durationMinutes,
      status,
      priority,
      notes: Math.random() < 0.25 ? randomItem(NOTES) : undefined,
      source: randomItem(RESERVATION_SOURCE_VALUES),
      createdAt: createdAt.format("YYYY-MM-DDTHH:mm:ssZ"),
      updatedAt: updatedAt.format("YYYY-MM-DDTHH:mm:ssZ"),
    };
  }

  return null;
}

function buildReservations(
  date: string,
  timezoneName: string,
  serviceHours: ServiceHour[],
  tables: Table[],
  dayIndex: number,
) {
  const reservationsByTable = new Map<string, Reservation[]>();
  tables.forEach((table) => {
    reservationsByTable.set(table.id, []);
  });

  const targetCount = randomInt(8, 22);
  let reservationCounter = 1;

  for (let i = 0; i < targetCount; i += 1) {
    const table = randomItem(tables);
    const existingForTable = reservationsByTable.get(table.id) ?? [];
    const reservationId = `RES_${String(dayIndex).padStart(3, "0")}_${String(reservationCounter).padStart(3, "0")}`;
    const reservation = buildReservation(
      date,
      timezoneName,
      serviceHours,
      table,
      reservationId,
      existingForTable,
    );

    if (!reservation) {
      continue;
    }

    existingForTable.push(reservation);
    reservationCounter += 1;
  }

  return Array.from(reservationsByTable.values())
    .flat()
    .sort(
      (a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf(),
    );
}

export function createSeedData(count: number): ReservationTimelineRecord[] {
  const normalizedCount = Math.max(0, Math.floor(count));

  return Array.from({ length: normalizedCount }, (_, index) => {
    const date = buildDate(index);
    const restaurant = buildRestaurant(index);
    const sectors = buildSectors();
    const tables = buildTables(sectors);
    const reservations = buildReservations(
      date,
      restaurant.timezone,
      restaurant.serviceHours,
      tables,
      index,
    );

    return {
      date,
      restaurant,
      sectors,
      tables,
      reservations,
    };
  });
}
