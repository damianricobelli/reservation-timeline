import { Container } from "@/components/container";
import { Header } from "@/components/header";
import { SearchInput } from "./components/search-input";
import { FilterMenu } from "./components/filter-menu";
import { ViewModeSelector } from "./components/view-mode-selector";

export default function Page() {
  return (
    <main className="grid grid-rows-[auto_1fr] gap-4 h-[calc(100vh-2rem)]">
      <Header />
      <Container>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="inline-flex gap-3">
            <SearchInput />
            <FilterMenu />
          </div>
          <div className="inline-flex gap-3">
            <ViewModeSelector />
          </div>
        </div>
      </Container>
    </main>
  );
}
