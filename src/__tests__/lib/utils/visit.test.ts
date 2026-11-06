import { formatVisitDate } from "@/lib/utils/visit";

describe("formatVisitDate", () => {
  it("formats a valid date in en-GB locale with month name, day, year, and time", () => {
    const date = new Date(2024, 5, 15, 14, 30); // June 15, 2024 at 14:30 local time
    const result = formatVisitDate(date);
    expect(result).toContain("2024");
    expect(result).toContain("June");
    expect(result).toContain("15");
    expect(result).toContain("14:30");
  });

  it("returns 'Invalid Date' for an invalid date object", () => {
    const result = formatVisitDate(new Date("not-a-date"));
    expect(result).toBe("Invalid Date");
  });

  it("formats midnight as 00:00", () => {
    const date = new Date(2024, 0, 1, 0, 0); // January 1, 2024 at midnight local time
    const result = formatVisitDate(date);
    expect(result).toContain("00:00");
  });
});
