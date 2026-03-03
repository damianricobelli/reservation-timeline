import dayjs, { type Dayjs } from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import type { DateKey, ServiceHour } from "./types";

dayjs.extend(utc);
dayjs.extend(timezone);

export interface ServiceHourWindow {
  start: Dayjs;
  end: Dayjs;
}

/**
 * Parses "HH:mm" into a Dayjs timestamp for the provided date in the given timezone.
 */
export function parseServiceHourDate(
  dateKey: DateKey,
  time: string,
  timezoneName: string,
) {
  const [hourPart, minutePart] = time.split(":");
  const hour = Number.parseInt(hourPart ?? "0", 10);
  const minute = Number.parseInt(minutePart ?? "0", 10);

  return dayjs
    .tz(dateKey, timezoneName)
    .hour(Number.isNaN(hour) ? 0 : hour)
    .minute(Number.isNaN(minute) ? 0 : minute)
    .second(0)
    .millisecond(0);
}

export function getServiceHourWindows(
  dateKey: DateKey,
  serviceHours: ServiceHour[],
  timezoneName: string,
) {
  return serviceHours.map((serviceHour) => {
    const start = parseServiceHourDate(
      dateKey,
      serviceHour.start,
      timezoneName,
    );
    let end = parseServiceHourDate(dateKey, serviceHour.end, timezoneName);

    if (!end.isAfter(start)) {
      end = end.add(1, "day");
    }

    return { start, end };
  });
}

/**
 * Checks whether an interval is fully contained in at least one service window.
 */
export function isWithinServiceHours(
  startTime: Dayjs,
  endTime: Dayjs,
  dateKey: DateKey,
  serviceHours: ServiceHour[],
  timezoneName: string,
) {
  if (serviceHours.length === 0) {
    return true;
  }

  return getServiceHourWindows(dateKey, serviceHours, timezoneName).some(
    ({ start, end }) =>
      (startTime.isAfter(start) || startTime.isSame(start)) &&
      (endTime.isBefore(end) || endTime.isSame(end)),
  );
}
