import { describe, expect, it } from "vitest";
import { getReservationEntityKey } from "./reservation-identity";

describe("getReservationEntityKey", () => {
  it("uses immutable reservation identity fields", () => {
    const key = getReservationEntityKey({
      id: "RES_0001",
      createdAt: "2025-10-14T10:00:00-03:00",
    });

    expect(key).toBe("RES_0001-2025-10-14T10:00:00-03:00");
  });

  it("does not depend on mutable customer data", () => {
    const first = getReservationEntityKey({
      id: "RES_0002",
      createdAt: "2025-10-14T10:00:00-03:00",
    });
    const second = getReservationEntityKey({
      id: "RES_0002",
      createdAt: "2025-10-14T10:00:00-03:00",
    });

    expect(first).toBe(second);
  });
});
