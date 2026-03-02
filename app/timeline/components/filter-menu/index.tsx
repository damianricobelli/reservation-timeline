"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { timelineOptions } from "@/data/timeline-options";
import { useTimelineQueryState } from "@/hooks/use-timeline-query-state";
import { getSeedSelectionForView } from "../timeline-selection";
import { SectorsSubMenu } from "./sectors-sub-menu";
import { StatusSubMenu } from "./status-sub-menu";
import { TablesSubMenu } from "./tables-sub-menu";

export const FilterMenu = () => {
  const { data } = useSuspenseQuery(timelineOptions);

  const [view] = useTimelineQueryState("view");
  const [date] = useTimelineQueryState("date");

  const { sectors, tables } = getSeedSelectionForView(data, view, {
    baseDate: date,
    fallbackToSeedDate: true,
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline">
            Filters <SlidersHorizontalIcon className="inline-end" />
          </Button>
        }
      />
      <DropdownMenuContent sideOffset={6} align="start">
        <SectorsSubMenu sectors={sectors} />
        <TablesSubMenu sectors={sectors} tables={tables} />
        <StatusSubMenu />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
