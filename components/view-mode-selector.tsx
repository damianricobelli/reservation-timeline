"use client";

import { useQueryState } from "nuqs";
import { Tabs, TabsList, TabsTrigger } from "./ui/tabs";
import { searchParams } from "@/core/search-params";
import {
  CalendarDaysIcon,
  CalendarIcon,
  CalendarRangeIcon,
} from "lucide-react";

const { view } = searchParams;

export const ViewModeSelector = () => {
  const [viewMode, setViewMode] = useQueryState(
    view.value,
    view.parse.withDefault("day"),
  );
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
