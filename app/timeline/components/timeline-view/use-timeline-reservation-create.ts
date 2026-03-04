import type {
  TimelineReservationCreateApi,
  UseTimelineReservationCreateInput,
} from "./timeline-create/types";
import { useCreateDraft } from "./timeline-create/use-create-draft";
import { useCreatePointerSession } from "./timeline-create/use-create-pointer-session";

export type {
  RowCreatePointerHandlers,
  TimelineCreateDraft,
  TimelineCreatePreview,
  TimelineQuickCreateSubmitInput,
  TimelineQuickCreateSubmitResult,
  TimelineReservationCreateApi,
} from "./timeline-create/types";

/**
 * Encapsulates click-and-drag creation of reservations on empty timeline rows.
 *
 * This hook is intentionally thin and composes:
 * - draft lifecycle/submit logic
 * - pointer + auto-scroll create session logic
 */
export function useTimelineReservationCreate({
  records,
  setRecords,
  zoomPercent,
  rightViewportRef,
}: UseTimelineReservationCreateInput): TimelineReservationCreateApi {
  const { draft, closeDraft, queueOpenDraft, submitDraft } = useCreateDraft({
    records,
    setRecords,
  });

  const { getRowCreatePointerHandlers, getRowCreatePreview } =
    useCreatePointerSession({
      records,
      zoomPercent,
      rightViewportRef,
      queueOpenDraft,
    });

  return {
    getRowCreatePointerHandlers,
    getRowCreatePreview,
    draft,
    closeDraft,
    submitDraft,
  };
}
