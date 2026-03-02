"use client";

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";
import type { Ref, UIEventHandler } from "react";

import { cn } from "@/lib/utils";

export function ScrollArea({
  className,
  viewportRef,
  onViewportScroll,
  children,
  ...props
}: ScrollAreaPrimitive.Root.Props & {
  viewportRef?: Ref<HTMLDivElement>;
  onViewportScroll?: UIEventHandler<HTMLDivElement>;
}) {
  const assignViewportRef = (node: HTMLDivElement | null) => {
    if (!viewportRef) {
      return;
    }
    if (typeof viewportRef === "function") {
      viewportRef(node);
      return;
    }
    viewportRef.current = node;
  };

  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn("relative", className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        ref={assignViewportRef}
        onScroll={onViewportScroll}
        className="h-full"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar className="z-120 relative flex rounded bg-gray-200 opacity-0 transition-opacity pointer-events-none before:absolute before:content-[''] data-[orientation=vertical]:m-0 data-[orientation=vertical]:w-1 data-[orientation=vertical]:before:h-full data-[orientation=vertical]:before:w-5 data-[orientation=vertical]:before:left-1/2 data-[orientation=vertical]:before:-translate-x-1/2 data-hovering:pointer-events-auto data-hovering:opacity-100 data-hovering:delay-0 data-scrolling:pointer-events-auto data-scrolling:opacity-100 data-scrolling:duration-0">
        <ScrollAreaPrimitive.Thumb className="w-full rounded bg-gray-500" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Scrollbar
        className="z-120 relative flex rounded bg-gray-200 opacity-0 transition-opacity pointer-events-none before:absolute before:content-[''] data-[orientation=horizontal]:m-0 data-[orientation=horizontal]:h-1 data-[orientation=horizontal]:before:h-5 data-[orientation=horizontal]:before:w-full data-[orientation=horizontal]:before:left-0 data-[orientation=horizontal]:before:right-0 data-[orientation=horizontal]:before:-bottom-2 data-hovering:pointer-events-auto data-hovering:opacity-100 data-hovering:delay-0 data-scrolling:pointer-events-auto data-scrolling:opacity-100 data-scrolling:duration-0"
        orientation="horizontal"
      >
        <ScrollAreaPrimitive.Thumb className="w-full rounded bg-gray-500" />
      </ScrollAreaPrimitive.Scrollbar>
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}
