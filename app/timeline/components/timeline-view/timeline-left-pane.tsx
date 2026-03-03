import { ChevronDownIcon } from "lucide-react";
import type { RefObject, UIEventHandler } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { HEADER_HEIGHT_PX, TABLE_LABEL_COL_PX } from "@/core/constants";
import type { TimelineDayModel } from "./types";

type TimelineLeftPaneProps = {
  days: TimelineDayModel[];
  leftPaneRef: RefObject<HTMLDivElement | null>;
  onScroll: UIEventHandler<HTMLDivElement>;
  isSectorOpen: (sectorKey: string) => boolean;
  onSectorOpenChange: (sectorKey: string, open: boolean) => void;
};

function formatTableCapacity(min: number, max: number): string {
  if (min === max) {
    return `Seats ${min} ${min === 1 ? "guest" : "guests"}`;
  }

  return `Seats ${min}-${max} guests`;
}

export function TimelineLeftPane({
  days,
  leftPaneRef,
  onScroll,
  isSectorOpen,
  onSectorOpenChange,
}: TimelineLeftPaneProps) {
  return (
    <div
      className="shrink-0 border-r border-slate-200 bg-white"
      style={{ width: TABLE_LABEL_COL_PX }}
    >
      <div
        ref={leftPaneRef}
        onScroll={onScroll}
        className="h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {days.map((day) => (
          <section
            key={`left-${day.dateKey}`}
            className="border-b border-slate-200 bg-white last:border-b-0"
          >
            <div className="sticky top-0 z-50 flex h-14 flex-col justify-start border-b border-slate-200 bg-slate-50/95 px-3 pt-2.5 backdrop-blur">
              <span className="truncate text-sm font-semibold text-slate-900">
                {day.dayLabel}
              </span>
              <span className="text-xs leading-tight text-slate-500">
                {day.reservationCount} reservations
              </span>
            </div>

            {day.sectors.map(({ sector, sectorKey, tableRows }) => {
              const open = isSectorOpen(sectorKey);

              return (
                <Collapsible
                  key={`left-${day.dateKey}-${sector.id}`}
                  open={open}
                  onOpenChange={(nextOpen) =>
                    onSectorOpenChange(sectorKey, nextOpen)
                  }
                >
                  <div
                    className="sticky z-40 h-10 border-b border-slate-200 bg-slate-50/95 backdrop-blur"
                    style={{ top: HEADER_HEIGHT_PX }}
                  >
                    <CollapsibleTrigger className="flex h-full w-full items-center justify-between gap-2 px-3 text-left">
                      <span className="inline-flex min-w-0 items-center gap-2">
                        <ChevronDownIcon className="size-3 transition-all ease-out group-data-panel-open:rotate-180" />
                        <span className="truncate text-sm font-medium text-slate-900">
                          {sector.name}
                        </span>
                      </span>
                      <span className="text-xs text-slate-500">
                        {tableRows.length} tables
                      </span>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    <div>
                      {tableRows.map(({ table }) => (
                        <div
                          key={`left-${day.dateKey}-${table.id}`}
                          className="flex h-15 items-center border-b border-slate-200 bg-white px-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {table.name}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatTableCapacity(
                                table.capacity.min,
                                table.capacity.max,
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
