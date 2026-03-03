import {
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_VALUES,
  type ReservationStatus,
} from "@/core/types";
import { useTimelineQueryState } from "@/hooks/use-timeline-query-state";

const STATUS_DOT_CLASS_BY_VALUE: Record<ReservationStatus, string> = {
  PENDING: "bg-amber-400",
  CONFIRMED: "bg-blue-500",
  SEATED: "bg-emerald-500",
  FINISHED: "bg-slate-400",
  NO_SHOW: "bg-rose-500",
  CANCELLED: "bg-slate-300",
};

const STATUS_CONFIGS = RESERVATION_STATUS_VALUES.map((value) => ({
  value,
  label: RESERVATION_STATUS_LABELS[value],
  dot: STATUS_DOT_CLASS_BY_VALUE[value],
}));

const ALL_STATUS_VALUES: ReservationStatus[] = [...RESERVATION_STATUS_VALUES];

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
