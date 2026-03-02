"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { useTimelineZoom } from "@/hooks/use-timeline-zoom";

export function ZoomControls() {
  const { zoomPercent, canZoomIn, canZoomOut, zoomIn, zoomOut } =
    useTimelineZoom();

  useHotkey({ mod: true, key: "-" }, (event) => {
    event.preventDefault();
    zoomOut();
  });

  useHotkey({ mod: true, key: "=" }, (event) => {
    event.preventDefault();
    zoomIn();
  });

  useHotkey({ mod: true, shift: true, key: "=" }, (event) => {
    event.preventDefault();
    zoomIn();
  });

  return (
    <ButtonGroup>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={zoomOut}
        disabled={!canZoomOut}
        aria-label="Zoom out"
      >
        <MinusIcon />
      </Button>
      <Button
        type="button"
        variant="outline"
        aria-label="Zoom value"
        className="bg-background text-xs"
      >
        {zoomPercent}%
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={zoomIn}
        disabled={!canZoomIn}
        aria-label="Zoom in"
      >
        <PlusIcon />
      </Button>
    </ButtonGroup>
  );
}
