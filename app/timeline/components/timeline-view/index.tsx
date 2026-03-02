"use client";

import { useKeyHold } from "@tanstack/react-hotkeys";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { WheelEvent } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SLOT_WIDTH_PX } from "@/core/constants";
import { timelineOptions } from "@/data/timeline-options";
import { useTimelineQueryState } from "@/hooks/use-timeline-query-state";
import { useTimelineZoom } from "@/hooks/use-timeline-zoom";
import { getSeedSelectionForView } from "../timeline-selection";
import { TimelineLeftPane } from "./timeline-left-pane";
import { TimelineRightContent } from "./timeline-right-content";
import type { TimelineCssVars } from "./types";
import { useSyncedVerticalScroll } from "./use-synced-vertical-scroll";
import { useTimelineInteractions } from "./use-timeline-interactions";
import { useTimelineViewModel } from "./use-timeline-view-model";

export const TimelineView = () => {
  const { data } = useSuspenseQuery(timelineOptions);

  const [view] = useTimelineQueryState("view");
  const [search] = useTimelineQueryState("search");
  const [status] = useTimelineQueryState("status");
  const [selectedSectorIds] = useTimelineQueryState("sectors");
  const [selectedTableIds] = useTimelineQueryState("tables");
  const { zoomPercent, zoomIn, zoomOut } = useTimelineZoom();
  const isMetaHold = useKeyHold("Meta");
  const isControlHold = useKeyHold("Control");

  const selection = getSeedSelectionForView(data, view, {
    fallbackToSeedDate: true,
    search,
    statuses: status,
    sectorIds: selectedSectorIds,
    tableIds: selectedTableIds,
  });

  const {
    selectedReservationKeys,
    isSectorOpen,
    setSectorOpen,
    handleReservationClick,
    handleTimelinePointerDown,
  } = useTimelineInteractions();

  const { days, tableById, sectorById } = useTimelineViewModel(selection);

  const timelineCssVars: TimelineCssVars = {
    "--timeline-zoom": `${zoomPercent / 100}`,
    "--timeline-slot-width-base": `${SLOT_WIDTH_PX}px`,
  };

  const handleTimelineWheel = (event: WheelEvent<HTMLDivElement>) => {
    const isModifierHold =
      isMetaHold || isControlHold || event.metaKey || event.ctrlKey;

    if (!isModifierHold || event.deltaY === 0) {
      return;
    }

    event.preventDefault();

    if (event.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  const {
    leftPaneRef,
    rightViewportRef,
    handleLeftPaneScroll,
    handleRightPaneScroll,
  } = useSyncedVerticalScroll();

  if (selection.sectors.length === 0 || selection.tables.length === 0) {
    return (
      <div className="min-h-0 rounded-2xl border border-dashed border-slate-300 grid place-items-center px-6 text-center bg-white">
        <p className="text-sm text-slate-500">
          No sectors match the selected filters.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-hidden border border-slate-200 rounded-xl">
      <TooltipProvider>
        <div
          className="flex h-full min-h-0 min-w-0"
          onPointerDownCapture={handleTimelinePointerDown}
          onWheelCapture={handleTimelineWheel}
        >
          <TimelineLeftPane
            days={days}
            leftPaneRef={leftPaneRef}
            onScroll={handleLeftPaneScroll}
            isSectorOpen={isSectorOpen}
            onSectorOpenChange={setSectorOpen}
          />

          <ScrollArea
            className="min-h-0 min-w-0 flex-1"
            viewportRef={rightViewportRef}
            onViewportScroll={handleRightPaneScroll}
          >
            <TimelineRightContent
              days={days}
              selectedReservationIds={selectedReservationKeys}
              tableById={tableById}
              sectorById={sectorById}
              timelineCssVars={timelineCssVars}
              onReservationClick={handleReservationClick}
              isSectorOpen={isSectorOpen}
              onSectorOpenChange={setSectorOpen}
            />
          </ScrollArea>
        </div>
      </TooltipProvider>
    </div>
  );
};
