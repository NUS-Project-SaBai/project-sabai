import {
  formatPatientCode,
  formatPatientId,
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

  it("measures the age on the given date instead of today", () => {
    vi.setSystemTime(new Date(2024, 5, 15)); // June 15, 2024
    // Turned 18 on Jan 1, 2024, but was still 17 at a Dec 2023 referral
    expect(calculateAge(new Date(2006, 0, 1), new Date(2023, 11, 20))).toBe(17);
  });
});
