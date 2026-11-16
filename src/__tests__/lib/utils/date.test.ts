import {
  toDateInputValue,
  formatDate,
  parseDateInput,
  todayIso,
  isFutureDate,
} from "@/lib/utils/date";
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

describe("date display and parsing", () => {
  it("formats UTC dates with padding and handles missing and invalid values", () => {
    expect(formatDate("2000-01-05T23:59:00-02:00")).toBe("06/01/2000");
    expect(formatDate(" ")).toBe("Not provided");
    expect(formatDate(null)).toBe("Not provided");
    expect(formatDate("bad")).toBe("Invalid date");
    expect(formatDate("0001-01-05")).toBe("05/01/0001");
    for (const value of ["2023-02-29", "2024-02-30"]) {
      expect(formatDate(value)).toBe("Invalid date");
      expect(toDateInputValue(value)).toBe("");
    }
    expect(
      formatDate("2000-01-05T23:59:00Z", { timeZone: "Asia/Singapore" }),
    ).toBe("06/01/2000");
  });
  it("accepts only real, strictly formatted dates", () => {
    expect(parseDateInput("29/02/2024")).toBe("2024-02-29");
    for (const value of [
      "29/02/2023",
      "29/02/1900",
      "31/04/2024",
      "1/01/2024",
      "",
      "01/01/0000",
    ])
      expect(parseDateInput(value)).toBeNull();
    expect(parseDateInput("29/02/2000")).toBe("2000-02-29");
  });
});

describe("todayIso", () => {
  afterEach(() => vi.useRealTimers());
  it("returns the local calendar day, zero-padded", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 5, 23, 59));
    expect(todayIso()).toBe("2024-01-05");
  });
});

describe("isFutureDate", () => {
  afterEach(() => vi.useRealTimers());
  it("is true only after today's local day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 5, 23, 59));
    expect(isFutureDate("2024-01-06")).toBe(true);
    expect(isFutureDate("2024-01-05")).toBe(false);
    expect(isFutureDate("2023-12-31")).toBe(false);
  });
});
