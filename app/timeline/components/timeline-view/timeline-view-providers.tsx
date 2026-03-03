import { DragDropProvider } from "@dnd-kit/react";
import type { ComponentProps, ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { TimelineReservationDndApi } from "./use-timeline-reservation-dnd";

type TimelineViewProvidersProps = {
  providerHandlers: TimelineReservationDndApi["providerHandlers"];
  modifiers: NonNullable<ComponentProps<typeof DragDropProvider>["modifiers"]>;
  children: ReactNode;
};

/**
 * Shared providers for tooltip and drag-and-drop context in timeline view.
 */
export function TimelineViewProviders({
  providerHandlers,
  modifiers,
  children,
}: TimelineViewProvidersProps) {
  return (
    <TooltipProvider>
      <DragDropProvider {...providerHandlers} modifiers={modifiers}>
        {children}
      </DragDropProvider>
    </TooltipProvider>
  );
}
