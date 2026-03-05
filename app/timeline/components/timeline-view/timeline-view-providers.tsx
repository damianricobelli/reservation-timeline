"use client";

import { DragDropProvider } from "@dnd-kit/react";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useContext,
} from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { TimelineRowDelegates } from "./timeline-row-delegates";
import type { TimelineReservationActionsApi } from "./use-timeline-reservation-actions";
import type { TimelineReservationDndApi } from "./use-timeline-reservation-dnd";

export type TimelineViewContextValue = {
  selectedReservationKeys: Set<string>;
  isSectorOpen: (sectorKey: string) => boolean;
  onSectorOpenChange: (sectorKey: string, open: boolean) => void;
  onTimelinePointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  rowDelegates: TimelineRowDelegates;
  reservationActionsApi: TimelineReservationActionsApi;
};

type TimelineViewProvidersProps = {
  providerHandlers: TimelineReservationDndApi["providerHandlers"];
  modifiers: NonNullable<ComponentProps<typeof DragDropProvider>["modifiers"]>;
  contextValue: TimelineViewContextValue;
  children: ReactNode;
};

const TimelineViewContext = createContext<TimelineViewContextValue | null>(
  null,
);

/**
 * Shared providers for tooltip and drag-and-drop context in timeline view.
 */
export function TimelineViewProviders({
  providerHandlers,
  modifiers,
  contextValue,
  children,
}: TimelineViewProvidersProps) {
  return (
    <TimelineViewContext.Provider value={contextValue}>
      <TooltipProvider>
        <DragDropProvider {...providerHandlers} modifiers={modifiers}>
          {children}
        </DragDropProvider>
      </TooltipProvider>
    </TimelineViewContext.Provider>
  );
}

export function useTimelineViewContext() {
  const context = useContext(TimelineViewContext);

  if (!context) {
    throw new Error(
      "useTimelineViewContext must be used within TimelineViewProviders",
    );
  }

  return context;
}
