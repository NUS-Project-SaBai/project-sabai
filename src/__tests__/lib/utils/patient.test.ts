import {
  formatPatientCode,
  formatPatientId,
  toDateInputValue,
} from "@/lib/utils/patient";

describe("formatPatientId", () => {
  it("zero-pads ids to 4 digits", () => {
    expect(formatPatientId(12)).toBe("0012");
  });

  it("leaves ids of 4 or more digits unchanged", () => {
    expect(formatPatientId(1234)).toBe("1234");
    expect(formatPatientId(12345)).toBe("12345");
  });
});

describe("formatPatientCode", () => {
  it("prefixes the village code when present", () => {
    expect(formatPatientCode("PC", 12)).toBe("PC0012");
  });
});

describe("toDateInputValue", () => {
  it("returns yyyy-MM-dd for an ISO string with a time component", () => {
    // The shape <input type='date'> requires; the time must be dropped.
    expect(toDateInputValue("1987-04-10T00:00:00.000Z")).toBe("1987-04-10");
  });

  it("returns yyyy-MM-dd for a bare date string", () => {
    expect(toDateInputValue("1987-04-10")).toBe("1987-04-10");
  });

  it("returns an empty string for an unparseable date string", () => {
    expect(toDateInputValue("not a date")).toBe("");
  });

  it("returns an empty string for an invalid Date object", () => {
    expect(toDateInputValue(new Date(NaN))).toBe("");
  });
});
