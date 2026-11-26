import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip, TOUCH_DISPLAY_MS } from "@/components/interactive/Tooltip";

describe("Tooltip", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  function renderTooltip({ disabled = false } = {}) {
    render(
      <>
        <Tooltip id="tip" content="Not applicable">
          <input
            type="checkbox"
            aria-label="Option"
            aria-describedby="tip"
            disabled={disabled}
          />
        </Tooltip>
        <p>Elsewhere</p>
      </>,
    );
  }

  /**
   * A finger tap. Fired directly rather than through user-event, which waits
   * on a setTimeout after each action and so hangs under Vitest fake timers.
   */
  function tap(target: Element) {
    fireEvent.pointerDown(target, { pointerType: "touch" });
    fireEvent.pointerUp(target, { pointerType: "touch" });
  }

  it("is hidden until hovered", () => {
    // Given - a control with a tooltip
    renderTooltip();
    // Then - the tooltip is not shown
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows on hover and hides when the pointer leaves", async () => {
    // Given - a control with a tooltip
    const user = userEvent.setup();
    renderTooltip();
    // When - the control is hovered
    await user.hover(screen.getByRole("checkbox", { name: "Option" }));
    // Then - the tooltip shows
    expect(screen.getByRole("tooltip")).toHaveTextContent("Not applicable");
    // When - the pointer leaves
    await user.unhover(screen.getByRole("checkbox", { name: "Option" }));
    // Then - it hides again
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows while focus is inside and hides on blur", async () => {
    // Given - a control with a tooltip
    const user = userEvent.setup();
    renderTooltip();
    // When - the control is tabbed to
    await user.tab();
    // Then - the tooltip shows
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    // When - focus moves away
    await user.tab();
    // Then - it hides
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("stays up after a tap until the display time runs out", () => {
    // Given - a disabled control with a tooltip, as used for adult patients
    vi.useFakeTimers();
    renderTooltip({ disabled: true });
    // When - the control is tapped
    tap(screen.getByRole("checkbox", { name: "Option" }));
    // Then - the tooltip shows and is still up just before the timeout
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(TOUCH_DISPLAY_MS - 1));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    // When - the display time runs out
    act(() => vi.advanceTimersByTime(1));
    // Then - it hides
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("restarts the display time when tapped again", () => {
    // Given - a tooltip opened by a tap, partway through its display time
    vi.useFakeTimers();
    renderTooltip({ disabled: true });
    const checkbox = screen.getByRole("checkbox", { name: "Option" });
    tap(checkbox);
    act(() => vi.advanceTimersByTime(TOUCH_DISPLAY_MS - 1000));
    // When - it is tapped again
    tap(checkbox);
    act(() => vi.advanceTimersByTime(TOUCH_DISPLAY_MS - 1));
    // Then - it is still up, timed from the second tap
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("hides when the user taps elsewhere", () => {
    // Given - a tooltip opened by a tap
    vi.useFakeTimers();
    renderTooltip({ disabled: true });
    tap(screen.getByRole("checkbox", { name: "Option" }));
    // When - the user taps somewhere else
    tap(screen.getByText("Elsewhere"));
    // Then - it hides straight away
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("describes the control for screen readers even while hidden", () => {
    // Given - a control pointing aria-describedby at the tooltip
    renderTooltip();
    // Then - the tooltip text is its accessible description
    expect(
      screen.getByRole("checkbox", { name: "Option" }),
    ).toHaveAccessibleDescription("Not applicable");
  });
});
