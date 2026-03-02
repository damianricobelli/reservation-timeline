import {
  DropdownMenuCheckboxItem,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import type { Sector } from "@/core/types";
import { useTimelineQueryState } from "@/hooks/use-timeline-query-state";
import {
  areAllItemsSelected,
  nextItemSelection,
  normalizeSelectionForQuery,
} from "./selection-utils";

interface SectorsSubMenuProps {
  sectors: Sector[];
}

export function SectorsSubMenu({ sectors }: SectorsSubMenuProps) {
  const [selectedSectorIds, setSelectedSectorIds] =
    useTimelineQueryState("sectors");

  const allSectorIds = sectors.map((sector) => sector.id);
  const normalizedSelectedSectorIds = normalizeSelectionForQuery(
    selectedSectorIds,
    allSectorIds,
  );
  const selectedSectorIdsSet = new Set(normalizedSelectedSectorIds);
  const allSectorsSelected = areAllItemsSelected(
    normalizedSelectedSectorIds,
    sectors.length,
  );
  const selectedSectorCount = allSectorsSelected
    ? sectors.length
    : normalizedSelectedSectorIds.length;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <span className="flex items-center gap-2">
          <span>Sectors</span>
          <span className="text-xs text-slate-400 tabular-nums">
            {selectedSectorCount}/{sectors.length}
          </span>
        </span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent sideOffset={4}>
          <DropdownMenuGroup>
            {sectors.map((sector) => {
              const checked =
                allSectorsSelected || selectedSectorIdsSet.has(sector.id);

              return (
                <DropdownMenuCheckboxItem
                  key={sector.id}
                  checked={checked}
                  onCheckedChange={(nextChecked) => {
                    setSelectedSectorIds((previous) =>
                      nextItemSelection(
                        normalizeSelectionForQuery(previous, allSectorIds),
                        allSectorIds,
                        sector.id,
                        nextChecked === true,
                      ),
                    );
                  }}
                >
                  <span>{sector.name}</span>
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
