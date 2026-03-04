import { describe, expect, it } from "vitest";
import { getTimelineWindow } from "./timeline-window";

describe("getTimelineWindow", () => {
  it("returns a timeline window anchored to restaurant timezone", () => {
    const { timelineStart, timelineEnd } = getTimelineWindow(
      "2025-10-15",
      "America/Argentina/Buenos_Aires",
    );

    expect(timelineStart.format("YYYY-MM-DD HH:mm")).toBe("2025-10-15 11:00");
    expect(timelineEnd.diff(timelineStart, "minute")).toBe(780);
  });

  it("respects timezone differences for the same date key", () => {
    const buenosAires = getTimelineWindow(
      "2025-10-15",
      "America/Argentina/Buenos_Aires",
    );
    const losAngeles = getTimelineWindow("2025-10-15", "America/Los_Angeles");

    expect(buenosAires.timelineStart.utc().format("YYYY-MM-DDTHH:mm")).not.toBe(
      losAngeles.timelineStart.utc().format("YYYY-MM-DDTHH:mm"),
    );
  });
});
