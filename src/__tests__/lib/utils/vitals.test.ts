import {
  computeBmi,
  formatBloodPressure,
  formatDiabetes,
} from "@/lib/utils/vitals";

describe("computeBmi", () => {
  it("computes BMI to two decimal places", () => {
    // 70kg at 175cm => 22.857... => "22.86" (rounded to 2 decimal places)
    expect(computeBmi("175", "70")).toBe("22.86");
  });

  it("returns a placeholder when height is missing", () => {
    expect(computeBmi(null, "70")).toBe("Invalid/Missing Height or Weight");
  });

  it("returns a placeholder when weight is missing", () => {
    expect(computeBmi("175", null)).toBe("Invalid/Missing Height or Weight");
  });

  it("returns a placeholder for non-numeric or zero values", () => {
    expect(computeBmi("abc", "70")).toBe("Invalid/Missing Height or Weight");
    expect(computeBmi("0", "70")).toBe("Invalid/Missing Height or Weight");
  });
});

describe("formatBloodPressure", () => {
  it("formats present readings", () => {
    expect(formatBloodPressure(120, 80)).toBe("120 / 80");
  });

  it("uses a dash for an individually missing value", () => {
    expect(formatBloodPressure(null, 80)).toBe("- / 80");
    expect(formatBloodPressure(120, null)).toBe("120 / -");
  });

  it("collapses to a single dash when both readings are missing", () => {
    expect(formatBloodPressure(undefined, undefined)).toBe("-");
    expect(formatBloodPressure(null, null)).toBe("-");
  });
});

describe("formatDiabetes", () => {
  it("maps booleans to Yes/No", () => {
    expect(formatDiabetes(true)).toBe("Yes");
    expect(formatDiabetes(false)).toBe("No");
  });

  it("maps null to the not-asked placeholder", () => {
    expect(formatDiabetes(null)).toBe("Not Applicable");
  });
});
