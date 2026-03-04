import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import {
  TIMELINE_DURATION_MINUTES,
  TIMELINE_START_HOUR,
} from "@/core/constants";
import type { DateKey } from "@/core/types";

dayjs.extend(utc);
dayjs.extend(timezone);

type TimelineWindow = {
  timelineStart: dayjs.Dayjs;
  timelineEnd: dayjs.Dayjs;
};

/**
 * Returns timeline start/end for a date in the provided timezone.
 */
export function getTimelineWindow(
  dateKey: DateKey,
  timezoneName: string,
): TimelineWindow {
  const timelineStart = dayjs
    .tz(dateKey, timezoneName)
    .hour(TIMELINE_START_HOUR)
    .minute(0)
    .second(0)
    .millisecond(0);

  return {
    timelineStart,
    timelineEnd: timelineStart.add(TIMELINE_DURATION_MINUTES, "minute"),
  };
}
