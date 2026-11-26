import { describe, it, expect } from "vitest";
import { sendBroadcastSchema } from "@/lib/validation/broadcasts";
import {
  BROADCAST_BODY_MAX_LENGTH,
  BROADCAST_TITLE_MAX_LENGTH,
} from "@/lib/constants/broadcasts";

describe("sendBroadcastSchema", () => {
  it("trims title and body and defaults severity to info", () => {
    expect(
      sendBroadcastSchema.parse({ title: "  Hi  ", body: "  There  " }),
    ).toEqual({ title: "Hi", body: "There", severity: "info" });
  });

  it.each([
    ["title", { title: "   ", body: "Body" }, "Please enter a title."],
    ["body", { title: "Title", body: "   " }, "Please enter a message."],
  ])("rejects a blank %s", (field, input, message) => {
    const result = sendBroadcastSchema.safeParse(input);
    expect(result.success).toBe(false);
    expect(result.error?.issues).toEqual([
      expect.objectContaining({ path: [field], message }),
    ]);
  });

  it("rejects a title or body over the max length", () => {
    const result = sendBroadcastSchema.safeParse({
      title: "a".repeat(BROADCAST_TITLE_MAX_LENGTH + 1),
      body: "a".repeat(BROADCAST_BODY_MAX_LENGTH + 1),
    });
    expect(result.error?.issues.map((issue) => issue.path)).toEqual([
      ["title"],
      ["body"],
    ]);
  });

  it("rejects an unknown severity", () => {
    expect(
      sendBroadcastSchema.safeParse({
        title: "Title",
        body: "Body",
        severity: "urgent",
      }).success,
    ).toBe(false);
  });
});
