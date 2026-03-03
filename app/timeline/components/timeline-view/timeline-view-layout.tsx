import type {
  PointerEventHandler,
  ReactNode,
  RefObject,
  UIEventHandler,
  WheelEventHandler,
} from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

type TimelineViewLayoutProps = {
  onPointerDownCapture: PointerEventHandler<HTMLDivElement>;
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
  onPointerDownCapture,
  onWheelCapture,
  leftPane,
  rightContent,
  rightViewportRef,
  onRightViewportScroll,
}: TimelineViewLayoutProps) {
  return (
    <div
      className="flex h-full min-h-0 min-w-0"
      onPointerDownCapture={onPointerDownCapture}
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
