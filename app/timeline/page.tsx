import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { getQueryClient } from "@/core/get-query-client";
import { timelineOptions } from "@/data/timeline-options";
import { Timeline } from "./components/timeline";

export default function Page() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(timelineOptions);

  return (
    <main className="grid h-[calc(100vh-2rem)] grid-rows-[auto_1fr] gap-4 overflow-hidden">
      <Header />
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Timeline.Root>
          <Timeline.Toolbar />
          <Timeline.View />
        </Timeline.Root>
      </HydrationBoundary>
    </main>
  );
}
