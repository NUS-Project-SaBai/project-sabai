import { describe, it, expect } from "vitest";
import { visualAcuitySchema, pinholeSchema } from "@/lib/validation/eyesight";

describe("visualAcuitySchema", () => {
  const valid = [
    "6/6",
    "6/9",
    "6/12",
    "6/18",
    "6/24",
    "6/36",
    "6/60",
    "6/60-",
    "6/12+",
    "CF",
    "HM",
    "PL",
    "NPL",
    "cf", // test for case-insensitive
    "npl",
    " 6/6 ", // have whitespace, to be trimmed before validation
  ];

  it.each(valid)("accepts valid notation %j", (input) => {
    expect(visualAcuitySchema.safeParse(input).success).toBe(true);
  });

  const invalid = [
    "66",
    "6-6",
    "6/7", // not a standard denominator
    "6/",
    "20/20", // imperial not accepted
    "garbage",
    "6/6++",
    "PLL",
  ];

  it.each(invalid)("rejects invalid notation %j", (input) => {
    expect(visualAcuitySchema.safeParse(input).success).toBe(false);
  });

  it("treats empty string as not recorded (valid)", () => {
    expect(visualAcuitySchema.safeParse("").success).toBe(true);
  });

  it("treats undefined as not recorded (valid, field is optional)", () => {
    expect(visualAcuitySchema.safeParse(undefined).success).toBe(true);
  });
});

describe("pinholeSchema", () => {
  it("accepts every acuity value the degree fields accept", () => {
    for (const v of ["6/6", "6/60", "6/12+", "CF", "HM", "PL", "NPL"]) {
      expect(pinholeSchema.safeParse(v).success).toBe(true);
    }
  });

  it("additionally accepts NI (no improvement), case-insensitive", () => {
    expect(pinholeSchema.safeParse("NI").success).toBe(true);
    expect(pinholeSchema.safeParse("ni").success).toBe(true);
  });

  it("rejects the same malformed values as the acuity schema", () => {
    for (const v of ["6/2", "20/20", "garbage", "PLL"]) {
      expect(pinholeSchema.safeParse(v).success).toBe(false);
    }
  });

  it("treats empty/undefined as not recorded", () => {
    expect(pinholeSchema.safeParse("").success).toBe(true);
    expect(pinholeSchema.safeParse(undefined).success).toBe(true);
  });
});

describe("NI is pinhole-only", () => {
  it("is rejected by the visual acuity (degree) schema", () => {
    // "NI" (no improvement) is only meaningful for a pinhole test, so the
    // plain acuity/degree fields must not accept it.
    expect(visualAcuitySchema.safeParse("NI").success).toBe(false);
  });

  it("is accepted by the pinhole schema", () => {
    expect(pinholeSchema.safeParse("NI").success).toBe(true);
  });
});
