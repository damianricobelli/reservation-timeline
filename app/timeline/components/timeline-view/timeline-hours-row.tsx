import { GRID_WIDTH_CSS } from "@/core/constants";
import { cn } from "@/lib/utils";
import { SLOT_LABELS } from "./utils";

type TimelineHoursRowProps = {
  rowKeyPrefix: string;
  zoomPercent: number;
  className?: string;
};

export function TimelineHoursRow({
  rowKeyPrefix,
  zoomPercent,
  className,
}: TimelineHoursRowProps) {
  const labelClassName =
    "pointer-events-none absolute top-2.5 text-[11px] font-semibold leading-none tracking-tight tabular-nums text-slate-600 bg-slate-50/90 px-1 rounded-sm";

  return (
    <div
      className={cn(
        "timeline-hours-grid-lines relative h-14 w-full overflow-hidden border-r border-b border-slate-200 bg-slate-50/95",
        className,
      )}
    >
      <div className="flex h-full">
        {SLOT_LABELS.map((_slotLabel, slotIndex) => (
          <div
            key={`${rowKeyPrefix}-${slotIndex}`}
            className="relative h-full shrink-0"
            style={{ width: "var(--timeline-slot-width)" }}
          >
            <span
              className={cn(
                "pointer-events-none absolute left-0 top-8 w-px bg-slate-400/60",
                slotIndex % 2 === 0 ? "h-2.5" : "h-1.5",
              )}
            />
          </div>
        ))}
      </div>

      {SLOT_LABELS.map((slotLabel, slotIndex) => {
        const shouldRenderLabel = zoomPercent > 50 || slotIndex % 2 === 0;

        if (!shouldRenderLabel) {
          return null;
        }

        return (
          <span
            key={`${rowKeyPrefix}-label-${slotIndex}`}
            className={cn(
              labelClassName,
              slotIndex === 0 ? "translate-x-0" : "-translate-x-1/2",
            )}
            style={{
              left: `calc(var(--timeline-slot-width) * ${slotIndex})`,
            }}
          >
            {slotLabel}
          </span>
        );
      })}

      <span
        className={cn(labelClassName, "-translate-x-full")}
        style={{ left: GRID_WIDTH_CSS }}
      >
        00:00
      </span>
    </div>
  );
}
