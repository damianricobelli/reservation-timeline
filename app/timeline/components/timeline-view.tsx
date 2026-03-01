"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ReservationStatus } from "@/core/types";
import { timelineOptions } from "@/data/timeline-options";
import { useTimelineQueryState } from "@/hooks/use-timeline-query-state";
import {
  getSeedSelectionForView,
  type SeedSelectionResult,
} from "./timeline-selection";

type SelectionTable = SeedSelectionResult["tables"][number];
type SelectionReservation = SeedSelectionResult["reservations"][number];
type SelectionSectorId = SelectionTable["sectorId"];
type SelectionTableId = SelectionTable["id"];

const STATUS_BADGE_CLASS: Record<ReservationStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  SEATED: "bg-emerald-100 text-emerald-800",
  FINISHED: "bg-slate-200 text-slate-700",
  NO_SHOW: "bg-rose-100 text-rose-800",
  CANCELLED: "bg-zinc-200 text-zinc-700",
};

function formatTimeRange(reservation: SelectionReservation) {
  return `${dayjs(reservation.startTime).format("HH:mm")} - ${dayjs(reservation.endTime).format("HH:mm")}`;
}

function getReservationRenderKey(reservation: SelectionReservation) {
  return `${reservation.id}-${reservation.tableId}-${reservation.startTime}`;
}

function getReservationsByTable(
  reservations: SeedSelectionResult["reservations"],
) {
  const map = new Map<SelectionTableId, SeedSelectionResult["reservations"]>();

  reservations.forEach((reservation) => {
    const current = map.get(reservation.tableId) ?? [];
    current.push(reservation);
    map.set(reservation.tableId, current);
  });

  map.forEach((tableReservations) => {
    tableReservations.sort(
      (a, b) => dayjs(a.startTime).valueOf() - dayjs(b.startTime).valueOf(),
    );
  });

  return map;
}

function getTablesBySector(tables: SeedSelectionResult["tables"]) {
  const map = new Map<SelectionSectorId, SeedSelectionResult["tables"]>();

  tables.forEach((table) => {
    const current = map.get(table.sectorId) ?? [];
    current.push(table);
    map.set(table.sectorId, current);
  });

  return map;
}

export const TimelineView = () => {
  const { data } = useSuspenseQuery(timelineOptions);

  const [view] = useTimelineQueryState("view");
  const [search] = useTimelineQueryState("search");
  const [status] = useTimelineQueryState("status");
  const [selectedSectorIds] = useTimelineQueryState("sectors");
  const [selectedTableIds] = useTimelineQueryState("tables");

  const selection = getSeedSelectionForView(data, view, {
    fallbackToSeedDate: true,
    search,
    statuses: status,
    sectorIds: selectedSectorIds,
    tableIds: selectedTableIds,
  });

  const reservationsByTable = getReservationsByTable(selection.reservations);
  const tablesBySector = getTablesBySector(selection.tables);

  return (
    <ScrollArea className="min-h-0">
      {selection.sectors.length === 0 ? (
        <div className="h-full rounded-2xl border border-dashed border-slate-300 grid place-items-center px-6 text-center">
          <p className="text-sm text-slate-500">
            No sectors match the selected filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {selection.sectors.map((sector) => {
            const sectorTables = tablesBySector.get(sector.id) ?? [];

            return (
              <section
                key={sector.id}
                className="rounded-2xl border border-slate-200 overflow-hidden"
              >
                <header className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ backgroundColor: sector.color }}
                    />
                    <h3 className="text-sm font-medium text-slate-900">
                      {sector.name}
                    </h3>
                  </div>
                  <Badge variant="outline">{sectorTables.length} tables</Badge>
                </header>

                <div className="divide-y divide-slate-100">
                  {sectorTables.map((table) => {
                    const tableReservations =
                      reservationsByTable.get(table.id) ?? [];

                    return (
                      <article
                        key={table.id}
                        className="grid md:grid-cols-[220px_1fr]"
                      >
                        <div className="px-3 py-3 bg-slate-50/40 border-r border-slate-100">
                          <p className="text-sm font-medium text-slate-900">
                            {table.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            Capacity {table.capacity.min}-{table.capacity.max}
                          </p>
                        </div>
                        <div className="px-3 py-3">
                          {tableReservations.length === 0 ? (
                            <p className="text-xs text-slate-500">
                              No reservations for this table.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {tableReservations.map((reservation) => (
                                <div
                                  key={getReservationRenderKey(reservation)}
                                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-2 min-w-55"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium text-slate-900 truncate">
                                      {reservation.customer.name}
                                    </p>
                                    <Badge
                                      className={
                                        STATUS_BADGE_CLASS[reservation.status]
                                      }
                                    >
                                      {reservation.status}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-slate-600 mt-1">
                                    {formatTimeRange(reservation)} · Party{" "}
                                    {reservation.partySize}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </ScrollArea>
  );
};
