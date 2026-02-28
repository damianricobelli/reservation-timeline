"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReservationStatus } from "@/core/types";
import { useTimelineQueryState } from "@/hooks/use-timeline-query-state";
import { useSuspenseQuery } from "@tanstack/react-query";
import { timelineOptions } from "@/data/timeline-options";

interface StatusConfig {
  value: ReservationStatus;
  label: string;
  dot: string;
}

const STATUS_CONFIGS: StatusConfig[] = [
  { value: "PENDING", label: "Pending", dot: "bg-amber-400" },
  { value: "CONFIRMED", label: "Confirmed", dot: "bg-blue-500" },
  { value: "SEATED", label: "Seated", dot: "bg-emerald-500" },
  { value: "FINISHED", label: "Finished", dot: "bg-slate-400" },
  { value: "NO_SHOW", label: "No Show", dot: "bg-rose-500" },
  { value: "CANCELLED", label: "Cancelled", dot: "bg-slate-300" },
];

const ALL_STATUS_VALUES = STATUS_CONFIGS.map(({ value }) => value);

export const FilterMenu = () => {
  const { data } = useSuspenseQuery(timelineOptions);

  console.log(data)

  const [status, setStatus] = useTimelineQueryState("status", {
    defaultValue: ALL_STATUS_VALUES,
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
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span className="flex items-center gap-2">
              <span>Tables</span>
              {/*{!allTablesSelected && (
                  <span className="text-xs text-slate-400 tabular-nums">
                    {selectedTableIds.length}/{tables.length}
                  </span>
                )}*/}
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent sideOffset={4}>
              <DropdownMenuGroup>
                {STATUS_CONFIGS.map(({ value, label, dot }) => {
                  const on = status.includes(value);
                  return (
                    <DropdownMenuCheckboxItem
                      key={value}
                      checked={on}
                      onCheckedChange={() => {
                        setStatus((prev) => {
                          if (prev.includes(value)) {
                            if (prev.length === 1) return [];
                            return prev.filter((v) => v !== value);
                          }
                          return [...prev, value];
                        });
                      }}
                    >
                      <span className={`size-2 rounded-full shrink-0 ${dot}`} />
                      <span>{label}</span>
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <span className="flex items-center gap-2">
              <span>Status</span>
              <span className="text-xs text-slate-400 tabular-nums">
                {status.length}/{STATUS_CONFIGS.length}
              </span>
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent sideOffset={4}>
              <DropdownMenuGroup>
                {STATUS_CONFIGS.map(({ value, label, dot }) => {
                  const on = status.includes(value);
                  return (
                    <DropdownMenuCheckboxItem
                      key={value}
                      checked={on}
                      onCheckedChange={() => {
                        setStatus((prev) => {
                          if (prev.includes(value)) {
                            console.log(prev.length === 1);
                            if (prev.length === 1) return ALL_STATUS_VALUES;
                            return prev.filter((v) => v !== value);
                          }
                          return [...prev, value];
                        });
                      }}
                    >
                      <span className={`size-2 rounded-full shrink-0 ${dot}`} />
                      <span>{label}</span>
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuGroup>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
