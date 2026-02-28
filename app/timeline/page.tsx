import { Container } from "@/components/container";
import { Header } from "@/components/header";
import { SearchInput } from "./components/search-input";
import { FilterMenu } from "./components/filter-menu";
import { ViewModeSelector } from "./components/view-mode-selector";
import { getQueryClient } from "@/core/get-query-client";
import { timelineOptions } from "@/data/timeline-options";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default function Page() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(timelineOptions);

  return (
    <main className="grid grid-rows-[auto_1fr] gap-4 h-[calc(100vh-2rem)]">
      <Header />
      <HydrationBoundary state={dehydrate(queryClient)}>
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
      </HydrationBoundary>
    </main>
  );
}
