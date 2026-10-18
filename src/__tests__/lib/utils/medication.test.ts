import { positiveNumberOptions } from "@/lib/utils/medication";

describe("positiveNumberOptions", () => {
  it("sets valueAsNumber to true", () => {
    expect(positiveNumberOptions.valueAsNumber).toBe(true);
  });

  it("requires a minimum value of 1 with an error message", () => {
    expect(positiveNumberOptions.min).toEqual({
      value: 1,
      message: "Please input only positive values.",
    });
  });

  it("marks the field as required", () => {
    expect(positiveNumberOptions.required).toBe(true);
  });
});
