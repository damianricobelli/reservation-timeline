import { DateControls } from "./date-controls";
import { FilterMenu } from "./filter-menu";
import { SearchInput } from "./search-input";
import { ViewModeSelector } from "./view-mode-selector";
import { ZoomControls } from "./zoom-controls";

export const TimelineToolbar = () => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="inline-flex gap-3">
        <SearchInput />
        <FilterMenu />
        <ZoomControls />
      </div>
      <div className="inline-flex items-center gap-3">
        <DateControls />
        <ViewModeSelector />
      </div>
    </div>
  );
};
