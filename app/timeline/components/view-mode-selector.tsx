"use client";

import {
  CalendarDaysIcon,
  CalendarIcon,
  CalendarRangeIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTimelineQueryState } from "@/hooks/use-timeline-query-state";

export const ViewModeSelector = () => {
  const [viewMode, setViewMode] = useTimelineQueryState("view");
  return (
    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value)}>
      <TabsList>
        <TabsTrigger value="day">
          <CalendarIcon />
          Day
        </TabsTrigger>
        <TabsTrigger value="3-day">
          <CalendarDaysIcon />3 Day
        </TabsTrigger>
        <TabsTrigger value="week">
          <CalendarRangeIcon />
          Week
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
