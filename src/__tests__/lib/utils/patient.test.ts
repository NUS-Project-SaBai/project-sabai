import {
  formatPatientCode,
  formatPatientId,
  toDateInputValue,
  calculateAge,
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

  it("preserves single-digit month padding", () => {
    expect(toDateInputValue("2000-01-05")).toBe("2000-01-05");
  });

  it("preserves single-digit day padding", () => {
    expect(toDateInputValue("2000-12-01")).toBe("2000-12-01");
  });

  it("handles end-of-month dates correctly", () => {
    expect(toDateInputValue("2024-02-29T00:00:00.000Z")).toBe("2024-02-29");
  });

  it("handles a Date object", () => {
    expect(toDateInputValue(new Date("2005-06-15T00:00:00.000Z"))).toBe(
      "2005-06-15",
    );
  });

  it("returns an empty string for an unparseable date string", () => {
    expect(toDateInputValue("not a date")).toBe("");
  });

  it("returns an empty string for an invalid month/day string", () => {
    expect(toDateInputValue("2000-13-01")).toBe("");
  });

  it("returns an empty string for an invalid Date object", () => {
    expect(toDateInputValue(new Date(NaN))).toBe("");
  });
});

describe("calculateAge", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns the correct age when birthday has already passed this year", () => {
    vi.setSystemTime(new Date(2024, 5, 15)); // June 15, 2024
    expect(calculateAge(new Date(1990, 2, 10))).toBe(34); // March 10, 1990
  });

  it("returns the correct age when birthday is today", () => {
    vi.setSystemTime(new Date(2024, 5, 15)); // June 15, 2024
    expect(calculateAge(new Date(1990, 5, 15))).toBe(34); // June 15, 1990
  });

  it("subtracts one year when birthday has not yet passed this year", () => {
    vi.setSystemTime(new Date(2024, 5, 15)); // June 15, 2024
    expect(calculateAge(new Date(1990, 11, 31))).toBe(33); // December 31, 1990
  });
});

