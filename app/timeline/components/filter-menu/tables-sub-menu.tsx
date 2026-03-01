import {
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import type { Sector, Table } from "@/core/types";
import { useTimelineQueryState } from "@/hooks/use-timeline-query-state";
import {
  areAllItemsSelected,
  nextItemSelection,
  normalizeSelectionForQuery,
} from "./selection-utils";

interface TablesSubMenuProps {
  sectors: Sector[];
  tables: Table[];
}

export function TablesSubMenu({
  sectors,
  tables: allTables,
}: TablesSubMenuProps) {
  const [selectedSectorIds] = useTimelineQueryState("sectors");
  const [selectedTableIds, setSelectedTableIds] =
    useTimelineQueryState("tables");

  const allSectorIds = sectors.map((sector) => sector.id);
  const normalizedSelectedSectorIds = normalizeSelectionForQuery(
    selectedSectorIds,
    allSectorIds,
  );
  const selectedSectorIdsSet = new Set(normalizedSelectedSectorIds);
  const tables =
    normalizedSelectedSectorIds.length === 0
      ? allTables
      : allTables.filter((table) => selectedSectorIdsSet.has(table.sectorId));

  const sectorNameById = new Map(
    sectors.map((sector) => [sector.id, sector.name] as const),
  );
  const allTableIds = tables.map((table) => table.id);
  const normalizedSelectedTableIds = normalizeSelectionForQuery(
    selectedTableIds,
    allTableIds,
  );
  const selectedTableIdsSet = new Set(normalizedSelectedTableIds);
  const allTablesSelected = areAllItemsSelected(
    normalizedSelectedTableIds,
    tables.length,
  );
  const selectedTableCount = allTablesSelected
    ? tables.length
    : normalizedSelectedTableIds.length;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <span className="flex items-center gap-2">
          <span>Tables</span>
          <span className="text-xs text-slate-400 tabular-nums">
            {selectedTableCount}/{tables.length}
          </span>
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent sideOffset={4}>
          <DropdownMenuGroup>
            {tables.map((table) => {
              const checked =
                allTablesSelected || selectedTableIdsSet.has(table.id);

              return (
                <DropdownMenuCheckboxItem
                  key={table.id}
                  checked={checked}
                  onCheckedChange={(nextChecked) => {
                    setSelectedTableIds((previous) =>
                      nextItemSelection(
                        normalizeSelectionForQuery(previous, allTableIds),
                        allTableIds,
                        table.id,
                        nextChecked === true,
                      ),
                    );
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span>{table.name}</span>
                    <span className="text-xs text-slate-400">
                      {sectorNameById.get(table.sectorId) ?? "Unknown sector"}
                    </span>
                  </span>
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
