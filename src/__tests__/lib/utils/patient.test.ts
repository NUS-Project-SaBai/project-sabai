import {
  formatPatientCode,
  formatPatientId,
  matchesPatientSearch,
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

describe("matchesPatientSearch", () => {
  const patient = {
    id: 1,
    name: "Somchai Phuket",
    identificationNumber: "ID001",
    villageCode: "PC",
  };
  // A patient with no visits has no village code, so only the 4-digit id exists.
  const patientWithoutVisits = {
    id: 12,
    name: "Nok",
    identificationNumber: null,
    villageCode: null,
  };

  it("matches the 4-digit id", () => {
    expect(matchesPatientSearch(patient, "0001")).toBe(true);
  });

  it.each(["PC0001", "pc0001", "Pc0001"])(
    "matches the full code %s regardless of case",
    (searchText) => {
      expect(matchesPatientSearch(patient, searchText)).toBe(true);
    },
  );

  it("does not match a full code from a different village", () => {
    expect(
      matchesPatientSearch({ ...patient, villageCode: "CA" }, "PC0001"),
    ).toBe(false);
  });

  it("matches partial codes as substrings", () => {
    expect(matchesPatientSearch(patient, "1")).toBe(true);
    expect(matchesPatientSearch(patient, "001")).toBe(true);
    expect(matchesPatientSearch(patient, "pc00")).toBe(true);
  });

  it("does not match digits that are not in the code", () => {
    expect(matchesPatientSearch(patient, "2")).toBe(false);
  });

  it("finds a patient with no village code by their 4-digit id", () => {
    expect(matchesPatientSearch(patientWithoutVisits, "0012")).toBe(true);
    expect(matchesPatientSearch(patientWithoutVisits, "PC0012")).toBe(false);
  });

  it("does not match the village code from letters-only text", () => {
    const caPatient = { ...patientWithoutVisits, villageCode: "CA" };
    expect(matchesPatientSearch(caPatient, "ca")).toBe(false);
  });

  it("still matches the name regardless of case", () => {
    expect(matchesPatientSearch(patient, "somchai")).toBe(true);
    expect(matchesPatientSearch(patient, "PHUKET")).toBe(true);
  });

  it("still matches the identification number regardless of case", () => {
    expect(matchesPatientSearch(patient, "id001")).toBe(true);
  });

  it("ignores surrounding whitespace", () => {
    expect(matchesPatientSearch(patient, "  0001 ")).toBe(true);
  });

  it("matches nothing for empty or whitespace-only text", () => {
    expect(matchesPatientSearch(patient, "")).toBe(false);
    expect(matchesPatientSearch(patient, "   ")).toBe(false);
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
