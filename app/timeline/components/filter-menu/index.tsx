"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { SlidersHorizontalIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RESERVATION_STATUS_VALUES } from "@/core/types";
import { timelineOptions } from "@/data/timeline-options";
import { useTimelineFilters } from "@/hooks/use-timeline-filters";
import { getSeedSelectionForView } from "../timeline-selection";
import { SectorsSubMenu } from "./sectors-sub-menu";
import { normalizeSelectionForQuery } from "./selection-utils";
import { StatusSubMenu } from "./status-sub-menu";
import { TablesSubMenu } from "./tables-sub-menu";

export const FilterMenu = () => {
  const { data } = useSuspenseQuery(timelineOptions);
  const { filters } = useTimelineFilters();
  const {
    view,
    date,
    status,
    sectors: selectedSectorIds,
    tables: selectedTableIds,
  } = filters;

  const { sectors, tables } = getSeedSelectionForView(data, view, {
    baseDate: date,
    fallbackToSeedDate: true,
  });

  const normalizedSelectedSectorIds = normalizeSelectionForQuery(
    selectedSectorIds,
    sectors.map((sector) => sector.id),
  );
  const normalizedSelectedTableIds = normalizeSelectionForQuery(
    selectedTableIds,
    tables.map((table) => table.id),
  );

  const activeFilterCount =
    Number(normalizedSelectedSectorIds.length > 0) +
    Number(normalizedSelectedTableIds.length > 0) +
    Number(status.length < RESERVATION_STATUS_VALUES.length);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="relative">
            Filters
            <SlidersHorizontalIcon className="inline-end" />
            {activeFilterCount > 0 ? (
              <Badge className="pointer-events-none absolute -right-2 -top-2 h-5 rounded-full border-border bg-foreground px-1.5 text-[10px] font-semibold leading-none text-background tabular-nums shadow-sm">
                {activeFilterCount}
              </Badge>
            ) : null}
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
