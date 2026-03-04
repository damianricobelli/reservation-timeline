import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import {
  SLOT_MINUTES,
  SLOT_WIDTH_PX,
  TIMELINE_DURATION_MINUTES,
} from "@/core/constants";
import { getMinutesFromStart } from "./utils";

function msToNextMinute() {
  return 60_000 - (Date.now() % 60_000);
}

export function useTimelineNowIndicator(): number | null {
  const [tick, setTick] = useState<number | null>(null);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const scheduleNextTick = () => {
      setTick(Date.now());
      intervalId = setInterval(() => setTick(Date.now()), 60_000);
    };

    const timeoutId = setTimeout(scheduleNextTick, msToNextMinute());
    setTick(Date.now());

    // When the tab is backgrounded or the machine sleeps, browsers throttle or pause
    // setTimeout/setInterval. On visibility change to visible, sync the indicator
    // to current time so it doesn't stay stale until the next interval tick.
    const onVisibilityChange = () => {
      console.log("visibilitychange", document.visibilityState);
      if (document.visibilityState === "visible") {
        setTick(Date.now());
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return useMemo(() => {
    if (tick === null) return null;

    const now = dayjs();
    const minutesFromStart = getMinutesFromStart(now);

    if (minutesFromStart < 0 || minutesFromStart > TIMELINE_DURATION_MINUTES) {
      return null;
    }

    return (minutesFromStart / SLOT_MINUTES) * SLOT_WIDTH_PX;
  }, [tick]);
}
