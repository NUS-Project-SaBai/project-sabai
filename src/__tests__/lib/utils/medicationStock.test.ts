import { validateSplits } from "@/lib/utils/medication-stock";
import { SplitPayload } from "@/types/medication-stock";
import { MAX_SPLITS } from "@/lib/constants/medicationStock";

function makeSplit(overrides: Partial<SplitPayload> = {}): SplitPayload {
  return {
    quantity: 5,
    location: "Shelf A",
    stockStatus: "active",
    remarks: "",
    ...overrides,
  };
}

describe("validateSplits", () => {
  it("rejects when there are no splits", () => {
    expect(validateSplits([], 10)).toEqual({
      success: false,
      message: "Submitting without a split does nothing!",
    });
  });

  it("rejects if there is only one split", () => {
    expect(validateSplits([makeSplit({ quantity: 10 })], 10)).toEqual({
      success: false,
      message:
        "Please use the editing function instead to edit a single split!",
    });
  });

  it("rejects if the length of splits exceed MAX_SPLITS", () => {
    const splits = Array.from({ length: MAX_SPLITS + 1 }, (_, index) =>
      makeSplit({ quantity: 1, location: `Shelf ${index}` }),
    );

    expect(validateSplits(splits, splits.length)).toEqual({
      success: false,
      message: "Please do not exceed " + MAX_SPLITS + " splits!",
    });
  });

  it("rejects if the total quantity in the splits does not equal the parent split quantity", () => {
    const splits = [
      makeSplit({ quantity: 4, location: "Shelf A" }),
      makeSplit({ quantity: 5, location: "Shelf B" }),
    ];

    expect(validateSplits(splits, 10)).toEqual({
      success: false,
      message: "Child stock quantity does not equal parent stock quantity!",
    });
  });

  it("rejects if splits are not distinct", () => {
    const splits = [makeSplit({ quantity: 5 }), makeSplit({ quantity: 5 })];

    expect(validateSplits(splits, 10)).toEqual({
      success: false,
      message: "Splits are not distinct!",
    });
  });

  it("accepts distinct splits that sum to the parent quantity at MAX_SPLITS", () => {
    const splits = Array.from({ length: MAX_SPLITS }, (_, index) =>
      makeSplit({ quantity: 1, location: `Shelf ${index}` }),
    );

    expect(validateSplits(splits, MAX_SPLITS)).toEqual({
      success: true,
      message: "Splits are valid!",
    });
  });

  it("accepts splits that differ only by stock status", () => {
    const splits = [
      makeSplit({ quantity: 3, stockStatus: "active" }),
      makeSplit({ quantity: 7, stockStatus: "reserved" }),
    ];

    expect(validateSplits(splits, 10)).toEqual({
      success: true,
      message: "Splits are valid!",
    });
  });
});
