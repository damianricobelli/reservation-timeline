import { Container } from "@/components/container";
import { FilterMenu } from "./filter-menu";
import { SearchInput } from "./search-input";
import { TimelineView } from "./timeline-view";
import { ViewModeSelector } from "./view-mode-selector";

const Root = ({ children }: { children: React.ReactNode }) => {
  return (
    <Container className="h-full min-h-0">
      <div className="flex h-full min-h-0 flex-col gap-4">{children}</div>
    </Container>
  );
};

const Toolbar = () => {
  return (
    <div className="flex items-center justify-between flex-wrap gap-3">
      <div className="inline-flex gap-3">
        <SearchInput />
        <FilterMenu />
      </div>
      <div className="inline-flex gap-3">
        <ViewModeSelector />
      </div>
    </div>
  );
};

export const Timeline = {
  Root,
  Toolbar,
  View: TimelineView,
};
