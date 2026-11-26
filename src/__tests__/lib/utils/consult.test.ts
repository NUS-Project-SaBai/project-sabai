import { CONSULT_EDIT_WINDOW_MS } from "@/lib/constants/consults";
import { isWithinConsultEditWindow } from "@/lib/utils/consult";

describe("isWithinConsultEditWindow", () => {
  const createdAt = new Date("2026-01-01T00:00:00Z");
  const created = createdAt.getTime();

  it("allows edits right up to the end of the window", () => {
    expect(isWithinConsultEditWindow(createdAt, created)).toBe(true);
    expect(
      isWithinConsultEditWindow(createdAt, created + CONSULT_EDIT_WINDOW_MS),
    ).toBe(true);
  });

  it("rejects edits after the window has passed", () => {
    expect(
      isWithinConsultEditWindow(
        createdAt,
        created + CONSULT_EDIT_WINDOW_MS + 1,
      ),
    ).toBe(false);
  });

  it("accepts an ISO string date", () => {
    expect(isWithinConsultEditWindow(createdAt.toISOString(), created)).toBe(
      true,
    );
  });
});
