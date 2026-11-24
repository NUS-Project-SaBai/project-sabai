import { dateOfBirthInput, dateOfBirthSchema } from "@/server/schemas/patients";

const message = (result: { error?: { issues: { message: string }[] } }) =>
  result.error?.issues[0].message;

describe("dateOfBirth schemas", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 5, 12, 0));
  });
  afterEach(() => vi.useRealTimers());

  it("rejects missing, invalid and future dates on the form", () => {
    expect(dateOfBirthSchema.safeParse("2024-01-05").success).toBe(true);
    expect(dateOfBirthSchema.safeParse("2024-02-29").success).toBe(false);
    expect(message(dateOfBirthSchema.safeParse(""))).toBe(
      "Missing Date of Birth!",
    );
    expect(message(dateOfBirthSchema.safeParse("2023-02-29"))).toBe(
      "Enter a valid date",
    );
    expect(message(dateOfBirthSchema.safeParse("2024-01-06"))).toBe(
      "Date of Birth cannot be in the future",
    );
  });

  it("applies the same rule on the server and returns a Date", () => {
    expect(dateOfBirthInput.parse("1985-03-15")).toEqual(
      new Date("1985-03-15T00:00:00Z"),
    );
    expect(message(dateOfBirthInput.safeParse("2024-01-06"))).toBe(
      "Date of Birth cannot be in the future",
    );
  });
});
