import { Container } from "@/components/container";
import { TimelineToolbar } from "./timeline-toolbar";
import { TimelineView } from "./timeline-view";

const Root = ({ children }: { children: React.ReactNode }) => {
  return (
    <Container className="h-full min-h-0 min-w-0">
      <div className="flex h-full min-h-0 min-w-0 flex-col gap-4">
        {children}
      </div>
    </Container>
  );
};

const Toolbar = () => {
  return <TimelineToolbar />;
};

export const Timeline = {
  Root,
  Toolbar,
  View: TimelineView,
};
