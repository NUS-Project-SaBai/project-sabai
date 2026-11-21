import { act, renderHook } from "@testing-library/react";
import { useSaveOnWrite } from "@/hooks/useSaveOnWrite";

const KEY = "saveOnWriteTest";

describe("useSaveOnWrite", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.clear();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("reads the stored value and writes changes after the debounce", () => {
    window.localStorage.setItem(KEY, JSON.stringify({ count: 1 }));
    const { result } = renderHook(() =>
      useSaveOnWrite(KEY, { count: 0 }, [], 100),
    );
    expect(result.current[0]).toEqual({ count: 1 });

    act(() => result.current[1]({ count: 2 }));
    act(() => vi.advanceTimersByTime(100));

    expect(window.localStorage.getItem(KEY)).toBe(JSON.stringify({ count: 2 }));
  });

  it("falls back to the initial value when reading throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    const { result } = renderHook(() =>
      useSaveOnWrite(KEY, { count: 0 }, [], 0),
    );

    expect(result.current[0]).toEqual({ count: 0 });
  });

  it("keeps working in memory when writing throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    const { result } = renderHook(() =>
      useSaveOnWrite(KEY, { count: 0 }, [], 0),
    );
    act(() => result.current[1]({ count: 5 }));
    act(() => vi.advanceTimersByTime(0));

    expect(result.current[0]).toEqual({ count: 5 });
    expect(console.warn).toHaveBeenCalled();
  });

  it("clear() resets state even when removing throws", () => {
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { result } = renderHook(() =>
      useSaveOnWrite(KEY, { count: 0 }, [], 0),
    );
    act(() => result.current[1]({ count: 3 }));

    act(() => result.current[2]());

    expect(result.current[0]).toEqual({ count: 0 });
  });
});
