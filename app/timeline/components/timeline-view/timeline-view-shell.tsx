import type {
  ComponentProps,
  PointerEvent,
  ReactNode,
  RefObject,
  UIEventHandler,
  WheelEvent,
} from "react";
import { TimelineViewEmptyState } from "./timeline-view-empty-state";
import { TimelineViewLayout } from "./timeline-view-layout";
import { TimelineViewProviders } from "./timeline-view-providers";
import type { TimelineReservationDndApi } from "./use-timeline-reservation-dnd";

type TimelineViewShellProps = {
  empty: boolean;
  providerHandlers: TimelineReservationDndApi["providerHandlers"];
  dragModifiers: NonNullable<
    ComponentProps<typeof TimelineViewProviders>["modifiers"]
  >;
  onTimelinePointerDown: (event: PointerEvent<HTMLDivElement>) => void;
  onTimelineWheel: (event: WheelEvent<HTMLDivElement>) => void;
  leftPane: ReactNode;
  rightContent: ReactNode;
  rightViewportRef: RefObject<HTMLDivElement | null>;
  onRightViewportScroll: UIEventHandler<HTMLDivElement>;
};

/**
 * Presentation shell for timeline view, including empty-state fallback,
 * providers, and two-pane layout.
 */
export function TimelineViewShell({
  empty,
  providerHandlers,
  dragModifiers,
  onTimelinePointerDown,
  onTimelineWheel,
  leftPane,
  rightContent,
  rightViewportRef,
  onRightViewportScroll,
}: TimelineViewShellProps) {
  if (empty) {
    return <TimelineViewEmptyState />;
  }

  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-hidden border border-slate-200 rounded-xl">
      <TimelineViewProviders
        providerHandlers={providerHandlers}
        modifiers={dragModifiers}
      >
        <TimelineViewLayout
          onPointerDownCapture={onTimelinePointerDown}
          onWheelCapture={onTimelineWheel}
          leftPane={leftPane}
          rightContent={rightContent}
          rightViewportRef={rightViewportRef}
          onRightViewportScroll={onRightViewportScroll}
        />
      </TimelineViewProviders>
    </div>
  );
}
