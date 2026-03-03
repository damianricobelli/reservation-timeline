export type UUID = string;
export type ISODateTime = string; // e.g., "2025-10-15T20:00:00-03:00"
export type DateKey = string; // e.g., "2025-10-15"
export type Minutes = number;
export type SlotIndex = number; // 0-based, each slot = 15min

export type RestaurantId = UUID;
export type SectorId = UUID;
export type TableId = UUID;
export type ReservationId = UUID;

export const DATE_KEY_FORMAT = "YYYY-MM-DD" as const;
export const TIMELINE_VIEW_MODE_VALUES = ["day", "3-day", "week"] as const;
export type TimelineViewMode = (typeof TIMELINE_VIEW_MODE_VALUES)[number];

export const RESERVATION_STATUS_VALUES = [
  "PENDING",
  "CONFIRMED",
  "SEATED",
  "FINISHED",
  "NO_SHOW",
  "CANCELLED",
] as const;

export type ReservationStatus = (typeof RESERVATION_STATUS_VALUES)[number];

export const RESERVATION_PRIORITY_VALUES = [
  "STANDARD",
  "VIP",
  "LARGE_GROUP",
] as const;

export type ReservationPriority = (typeof RESERVATION_PRIORITY_VALUES)[number];
export const RESERVATION_SOURCE_VALUES = [
  "phone",
  "web",
  "walkin",
  "app",
] as const;
export type ReservationSource = (typeof RESERVATION_SOURCE_VALUES)[number];

export const MOVE_VALIDATION_REASON_VALUES = [
  "overlap",
  "capacity_exceeded",
  "outside_service_hours",
  "outside_timeline",
] as const;
export type MoveValidationReason =
  (typeof MOVE_VALIDATION_REASON_VALUES)[number];

export type ConflictReason = Exclude<MoveValidationReason, "outside_timeline">;

export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SEATED: "Seated",
  FINISHED: "Finished",
  NO_SHOW: "No Show",
  CANCELLED: "Cancelled",
};

export const RESERVATION_PRIORITY_LABELS: Record<ReservationPriority, string> =
  {
    STANDARD: "Standard",
    VIP: "VIP",
    LARGE_GROUP: "Large Group",
  };

export interface Sector {
  id: SectorId;
  name: string;
  color: string;
  sortOrder: number;
}

export interface Table {
  id: TableId;
  sectorId: SectorId;
  name: string;
  capacity: {
    min: number;
    max: number;
  };
  sortOrder: number; // for Y-axis ordering
}

interface Customer {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}

export interface Reservation {
  id: ReservationId;
  tableId: TableId;
  customer: Customer;
  partySize: number;
  startTime: ISODateTime;
  endTime: ISODateTime;
  durationMinutes: Minutes;
  status: ReservationStatus;
  priority: ReservationPriority;
  notes?: string;
  source?: ReservationSource;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface TimelineConfig {
  date: DateKey;
  startHour: number; // 11
  endHour: number; // 24 (or 0 for midnight)
  slotMinutes: Minutes; // 15
  viewMode: TimelineViewMode;
}

export interface ConflictCheck {
  hasConflict: boolean;
  conflictingReservationIds: ReservationId[];
  reason?: ConflictReason;
}

export interface ServiceHour {
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

export interface Restaurant {
  id: RestaurantId;
  name: string;
  timezone: string;
  serviceHours: ServiceHour[];
}

export interface ReservationTimelineRecord {
  date: DateKey;
  restaurant: Restaurant;
  sectors: Sector[];
  tables: Table[];
  reservations: Reservation[];
}
