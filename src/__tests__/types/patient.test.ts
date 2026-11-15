import { describe, expect, it } from "vitest";
import { genderValues } from "@/db/schema/patients";
import { genderDropdown } from "@/types/patient";

describe("patient gender constants", () => {
  it("builds the dropdown from the database enum values", () => {
    expect(genderDropdown.map((option) => option.value)).toEqual([
      ...genderValues,
    ]);

    expect(genderDropdown).toEqual([
      { label: "Male", value: "male" },
      { label: "Female", value: "female" },
    ]);
  });
});
