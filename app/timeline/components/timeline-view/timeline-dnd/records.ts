import dayjs from "dayjs";
import type { Reservation, ReservationTimelineRecord } from "@/core/types";
import type { SelectionReservation } from "../types";
import { getReservationEntityKey } from "../utils";
import { DATE_KEY_FORMAT } from "./constants";

/**
 * Locates a reservation by stable entity key across all loaded records.
 */
export function findReservationByEntityKey(
  records: ReservationTimelineRecord[],
  reservationEntityKey: string,
): SelectionReservation | null {
  for (const record of records) {
    const match = record.reservations.find((reservation) => {
      return getReservationEntityKey(reservation) === reservationEntityKey;
    });

    if (match) {
      return match;
    }
  }

  return null;
}

/**
 * Applies a reservation move/resize result to records.
 *
 * - Same-day updates replace reservation in-place.
 * - Cross-day updates remove from source day and append to target day.
 * - Reservation ordering is normalized by start time in mutated days.
 */
export function commitReservationMove(
  records: ReservationTimelineRecord[],
  reservationEntityKey: string,
  nextReservation: SelectionReservation,
) {
  let sourceRecordIndex = -1;
  let sourceReservationIndex = -1;

  records.some((record, recordIndex) => {
    const reservationIndex = record.reservations.findIndex((reservation) => {
      return getReservationEntityKey(reservation) === reservationEntityKey;
    });

    if (reservationIndex < 0) {
      return false;
    }

    sourceRecordIndex = recordIndex;
    sourceReservationIndex = reservationIndex;
    return true;
  });

  if (sourceRecordIndex < 0 || sourceReservationIndex < 0) {
    return records;
  }

  const targetDateKey = dayjs(nextReservation.startTime).format(
    DATE_KEY_FORMAT,
  );
  const fallbackTargetRecordIndex = sourceRecordIndex;
  const targetRecordIndex = records.findIndex(
    (record) => record.date === targetDateKey,
  );
  const normalizedTargetRecordIndex =
    targetRecordIndex >= 0 ? targetRecordIndex : fallbackTargetRecordIndex;

  if (normalizedTargetRecordIndex === sourceRecordIndex) {
    return records.map((record, recordIndex) => {
      if (recordIndex !== sourceRecordIndex) {
        return record;
      }

      const reservations = record.reservations.map((reservation, index) => {
        if (index !== sourceReservationIndex) {
          return reservation;
        }

        return nextReservation;
      });

      reservations.sort(sortByStartTime);

      return {
        ...record,
        reservations,
      };
    });
  }

  return records.map((record, recordIndex) => {
    if (recordIndex === sourceRecordIndex) {
      return {
        ...record,
        reservations: record.reservations.filter(
          (_reservation, index) => index !== sourceReservationIndex,
        ),
      };
    }

    if (recordIndex === normalizedTargetRecordIndex) {
      const reservations = [...record.reservations, nextReservation];
      reservations.sort(sortByStartTime);
      return {
        ...record,
        reservations,
      };
    }

    return record;
  });
}

function sortByStartTime(a: Reservation, b: Reservation) {
  return dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf();
}
