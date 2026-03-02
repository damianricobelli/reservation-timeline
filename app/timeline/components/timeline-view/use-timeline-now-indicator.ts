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

    const timeoutId = setTimeout(() => {
      setTick(Date.now());
      intervalId = setInterval(() => setTick(Date.now()), 60_000);
    }, msToNextMinute());

    setTick(Date.now());

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
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
