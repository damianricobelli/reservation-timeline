"use client";

import { useMemo } from "react";
import { DEFAULT_ZOOM_PERCENT, ZOOM_STEPS } from "@/core/constants";
import { useTimelineQueryState } from "./use-timeline-query-state";

type ZoomDirection = -1 | 1;

export function useTimelineZoom() {
  const [zoomPercent, setZoomPercent] = useTimelineQueryState("zoom");

  const zoomIndex = useMemo(() => {
    const stepIndex = ZOOM_STEPS.indexOf(zoomPercent);
    return stepIndex >= 0
      ? stepIndex
      : ZOOM_STEPS.indexOf(DEFAULT_ZOOM_PERCENT);
  }, [zoomPercent]);

  const canZoomOut = zoomIndex > 0;
  const canZoomIn = zoomIndex < ZOOM_STEPS.length - 1;

  const setAdjacentZoom = (direction: ZoomDirection) => {
    const nextIndex = Math.min(
      Math.max(zoomIndex + direction, 0),
      ZOOM_STEPS.length - 1,
    );
    const nextZoom = ZOOM_STEPS[nextIndex];

    if (nextZoom !== undefined && nextZoom !== zoomPercent) {
      void setZoomPercent(nextZoom);
    }
  };

  const zoomIn = () => {
    setAdjacentZoom(1);
  };

  const zoomOut = () => {
    setAdjacentZoom(-1);
  };

  return {
    zoomPercent,
    canZoomIn,
    canZoomOut,
    zoomIn,
    zoomOut,
  };
}
