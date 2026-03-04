"use client";

import { SnapModifier } from "@dnd-kit/abstract/modifiers";
import { useKeyHold } from "@tanstack/react-hotkeys";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useMemo,
  type WheelEvent,
} from "react";
import { SLOT_WIDTH_PX } from "@/core/constants";
import type { ReservationTimelineRecord } from "@/core/types";
import { timelineOptions } from "@/data/timeline-options";
import { useTimelineFilters } from "@/hooks/use-timeline-filters";
import { useTimelineZoom } from "@/hooks/use-timeline-zoom";
import { getSeedSelectionForView } from "../timeline-selection";
import { TimelineLeftPane } from "./timeline-left-pane";
import { TimelineRightContent } from "./timeline-right-content";
import { TimelineViewShell } from "./timeline-view-shell";
import type { TimelineCssVars } from "./types";
import { useSyncedVerticalScroll } from "./use-synced-vertical-scroll";
import { useTimelineInteractions } from "./use-timeline-interactions";
import { useTimelineReservationActions } from "./use-timeline-reservation-actions";
import { useTimelineReservationCreate } from "./use-timeline-reservation-create";
import { useTimelineReservationDnd } from "./use-timeline-reservation-dnd";
import { useTimelineViewModel } from "./use-timeline-view-model";

/**
 * Orchestrates timeline state, query filters, DnD state, and scroll bindings.
 */
export const TimelineView = () => {
  const queryClient = useQueryClient();
  const { data } = useSuspenseQuery(timelineOptions);
  const timelineRecords = data;
  const setTimelineRecords = useCallback<
    Dispatch<SetStateAction<ReservationTimelineRecord[]>>
  >((updater) => {
    queryClient.setQueryData<ReservationTimelineRecord[]>(
      timelineOptions.queryKey,
      (previous) => {
        const baseRecords = previous ?? data;

        if (typeof updater === "function") {
          return (
            updater as (
              current: ReservationTimelineRecord[],
            ) => ReservationTimelineRecord[]
          )(baseRecords);
        }

        return updater;
      },
    );
  }, [data, queryClient]);
  const { filters } = useTimelineFilters();
  const {
    view,
    date,
    search,
    status,
    sectors: selectedSectorIds,
    tables: selectedTableIds,
  } = filters;
  const { zoomPercent, zoomIn, zoomOut } = useTimelineZoom();
  const isMetaHold = useKeyHold("Meta");
  const isControlHold = useKeyHold("Control");

  const selection = getSeedSelectionForView(timelineRecords, view, {
    baseDate: date,
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
  const {
    leftPaneRef,
    rightViewportRef,
    handleLeftPaneScroll,
    handleRightPaneScroll,
  } = useSyncedVerticalScroll();

  const { days, tableById } = useTimelineViewModel(selection);
  const dndApi = useTimelineReservationDnd({
    records: timelineRecords,
    setRecords: setTimelineRecords,
    tableById,
    zoomPercent,
  });
  const createApi = useTimelineReservationCreate({
    records: timelineRecords,
    setRecords: setTimelineRecords,
    zoomPercent,
    rightViewportRef,
  });
  const reservationActionsApi = useTimelineReservationActions({
    records: timelineRecords,
    setRecords: setTimelineRecords,
    tableById,
  });

  const timelineCssVars: TimelineCssVars = {
    "--timeline-zoom": `${zoomPercent / 100}`,
    "--timeline-slot-width-base": `${SLOT_WIDTH_PX}px`,
  };
  const dragModifiers = useMemo(
    () => [
      SnapModifier.configure({
        size: {
          x: Math.max(1, SLOT_WIDTH_PX * (zoomPercent / 100)),
          y: 1,
        },
      }),
    ],
    [zoomPercent],
  );

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

  return (
    <TimelineViewShell
      empty={selection.sectors.length === 0 || selection.tables.length === 0}
      providerHandlers={dndApi.providerHandlers}
      dragModifiers={dragModifiers}
      onTimelinePointerDown={handleTimelinePointerDown}
      onTimelineWheel={handleTimelineWheel}
      rightViewportRef={rightViewportRef}
      onRightViewportScroll={handleRightPaneScroll}
      leftPane={
        <TimelineLeftPane
          days={days}
          leftPaneRef={leftPaneRef}
          onScroll={handleLeftPaneScroll}
          isSectorOpen={isSectorOpen}
          onSectorOpenChange={setSectorOpen}
        />
      }
      rightContent={
        <TimelineRightContent
          days={days}
          selectedReservationIds={selectedReservationKeys}
          timelineCssVars={timelineCssVars}
          onReservationClick={handleReservationClick}
          isSectorOpen={isSectorOpen}
          onSectorOpenChange={setSectorOpen}
          dndApi={dndApi}
          createApi={createApi}
          reservationActionsApi={reservationActionsApi}
        />
      }
    />
  );
};
