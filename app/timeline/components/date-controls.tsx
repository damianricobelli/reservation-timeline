"use client";

import { format } from "date-fns";
import dayjs from "dayjs";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTimelineQueryState } from "@/hooks/use-timeline-query-state";

function parseDateParam(value: string): Date | null {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

function toDateParam(value: Date) {
  return format(value, "yyyy-MM-dd");
}

export function DateControls() {
  const [date, setDate] = useTimelineQueryState("date");
  const selectedDate = parseDateParam(date);
  const todayDateParam = toDateParam(new Date());

  const shiftDate = (direction: -1 | 1) => {
    const baseDate = selectedDate ?? new Date();
    const nextDate = dayjs(baseDate).add(direction, "day").toDate();
    void setDate(toDateParam(nextDate));
  };

  const goToToday = () => {
    void setDate(todayDateParam);
  };

  const handleDateSelect = (nextDate: Date | undefined) => {
    if (!nextDate) {
      return;
    }

    void setDate(toDateParam(nextDate));
  };

  return (
    <div className="inline-flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={goToToday}
        disabled={date === todayDateParam}
      >
        Today
      </Button>

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Previous day"
        onClick={() => shiftDate(-1)}
      >
        <ChevronLeftIcon />
      </Button>

      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="min-w-24 justify-start text-left font-normal"
            />
          }
        >
          <CalendarIcon />
          {selectedDate ? format(selectedDate, "MM/dd/yy") : <span>Date</span>}
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={handleDateSelect}
          />
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Next day"
        onClick={() => shiftDate(1)}
      >
        <ChevronRightIcon />
      </Button>
    </div>
  );
}
