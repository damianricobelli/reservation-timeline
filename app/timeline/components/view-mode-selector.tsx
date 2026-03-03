"use client";

import {
  CalendarDaysIcon,
  CalendarIcon,
  CalendarRangeIcon,
  type LucideIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TIMELINE_VIEW_MODE_VALUES, type TimelineViewMode } from "@/core/types";
import { useTimelineQueryState } from "@/hooks/use-timeline-query-state";

const VIEW_MODE_ICON_BY_MODE: Record<TimelineViewMode, LucideIcon> = {
  day: CalendarIcon,
  "3-day": CalendarDaysIcon,
  week: CalendarRangeIcon,
};

const VIEW_MODE_LABEL_BY_MODE: Record<TimelineViewMode, string> = {
  day: "Day",
  "3-day": "3 Day",
  week: "Week",
};

function isTimelineViewMode(value: string): value is TimelineViewMode {
  return TIMELINE_VIEW_MODE_VALUES.some((viewMode) => viewMode === value);
}

export const ViewModeSelector = () => {
  const [viewMode, setViewMode] = useTimelineQueryState("view");
  return (
    <Tabs
      value={viewMode}
      onValueChange={(value) => {
        if (isTimelineViewMode(value)) {
          setViewMode(value);
        }
      }}
    >
      <TabsList>
        {TIMELINE_VIEW_MODE_VALUES.map((mode) => {
          const Icon = VIEW_MODE_ICON_BY_MODE[mode];

          return (
            <TabsTrigger key={mode} value={mode}>
              <Icon />
              {VIEW_MODE_LABEL_BY_MODE[mode]}
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
};
