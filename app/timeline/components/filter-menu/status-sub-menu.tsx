import {
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import type { ReservationStatus } from "@/core/types";
import { useTimelineQueryState } from "@/hooks/use-timeline-query-state";

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

const ALL_STATUS_VALUES = STATUS_CONFIGS.map(
  ({ value }) => value,
) as ReservationStatus[];

export function StatusSubMenu() {
  const [status, setStatus] = useTimelineQueryState("status");

  return (
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
                    setStatus((previous) => {
                      if (previous.includes(value)) {
                        if (previous.length === 1) return ALL_STATUS_VALUES;
                        return previous.filter(
                          (statusValue) => statusValue !== value,
                        );
                      }

                      return [...previous, value];
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
  );
}
