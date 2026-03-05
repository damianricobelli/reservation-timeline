import type {
  ReactNode,
  RefObject,
  UIEventHandler,
  WheelEventHandler,
} from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTimelineViewContext } from "./timeline-view-providers";

type TimelineViewLayoutProps = {
  onWheelCapture: WheelEventHandler<HTMLDivElement>;
  leftPane: ReactNode;
  rightContent: ReactNode;
  rightViewportRef: RefObject<HTMLDivElement | null>;
  onRightViewportScroll: UIEventHandler<HTMLDivElement>;
};

/**
 * Two-pane timeline layout with left labels and right scrollable grid.
 */
export function TimelineViewLayout({
  onWheelCapture,
  leftPane,
  rightContent,
  rightViewportRef,
  onRightViewportScroll,
}: TimelineViewLayoutProps) {
  const { onTimelinePointerDown } = useTimelineViewContext();

  return (
    <div
      className="flex h-full min-h-0 min-w-0"
      onPointerDownCapture={onTimelinePointerDown}
      onWheelCapture={onWheelCapture}
    >
      {leftPane}

      <ScrollArea
        className="min-h-0 min-w-0 flex-1"
        viewportRef={rightViewportRef}
        onViewportScroll={onRightViewportScroll}
      >
        {rightContent}
      </ScrollArea>
    </div>
  );
}
