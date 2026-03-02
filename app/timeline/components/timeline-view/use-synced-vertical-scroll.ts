import { type UIEvent, useRef } from "react";

type ScrollSource = "left" | "right";

/**
 * References and event handlers required to keep two vertical scroll areas synchronized.
 */
type SyncedVerticalScrollBindings = {
  leftPaneRef: { current: HTMLDivElement | null };
  rightViewportRef: { current: HTMLDivElement | null };
  handleLeftPaneScroll: (event: UIEvent<HTMLDivElement>) => void;
  handleRightPaneScroll: (event: UIEvent<HTMLDivElement>) => void;
};

/**
 * Keeps the left pane and the right viewport in sync when either side is scrolled.
 *
 * It uses a source lock to avoid feedback loops where programmatic updates trigger
 * reciprocal scroll events indefinitely.
 */
export function useSyncedVerticalScroll(): SyncedVerticalScrollBindings {
  const leftPaneRef = useRef<HTMLDivElement | null>(null);
  const rightViewportRef = useRef<HTMLDivElement | null>(null);
  const syncScrollSourceRef = useRef<ScrollSource | null>(null);

  /**
   * Releases the current scroll lock on the next animation frame, once the
   * corresponding programmatic scroll event has had a chance to fire.
   */
  const releaseScrollLock = (source: ScrollSource) => {
    requestAnimationFrame(() => {
      if (syncScrollSourceRef.current === source) {
        syncScrollSourceRef.current = null;
      }
    });
  };

  /**
   * Mirrors the current `scrollTop` into the opposite scroll container.
   */
  const sync = (
    source: ScrollSource,
    targetRef: { current: HTMLDivElement | null },
    nextTop: number,
  ) => {
    const oppositeSource = source === "left" ? "right" : "left";

    if (syncScrollSourceRef.current === oppositeSource) {
      syncScrollSourceRef.current = null;
      return;
    }

    const target = targetRef.current;

    if (!target || Math.abs(target.scrollTop - nextTop) < 1) {
      return;
    }

    syncScrollSourceRef.current = source;
    target.scrollTop = nextTop;
    releaseScrollLock(source);
  };

  const handleLeftPaneScroll = (event: UIEvent<HTMLDivElement>) => {
    sync("left", rightViewportRef, event.currentTarget.scrollTop);
  };

  const handleRightPaneScroll = (event: UIEvent<HTMLDivElement>) => {
    sync("right", leftPaneRef, event.currentTarget.scrollTop);
  };

  return {
    leftPaneRef,
    rightViewportRef,
    handleLeftPaneScroll,
    handleRightPaneScroll,
  };
}
