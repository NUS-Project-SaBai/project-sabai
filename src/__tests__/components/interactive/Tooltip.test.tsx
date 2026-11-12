import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tooltip } from "@/components/interactive/Tooltip";

describe("Tooltip", () => {
  afterEach(() => {
    cleanup();
  });

  function renderTooltip() {
    render(
      <Tooltip id="tip" content="Not applicable">
        <input type="checkbox" aria-label="Option" aria-describedby="tip" />
      </Tooltip>,
    );
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

  it("describes the control for screen readers even while hidden", () => {
    // Given - a control pointing aria-describedby at the tooltip
    renderTooltip();
    // Then - the tooltip text is its accessible description
    expect(
      screen.getByRole("checkbox", { name: "Option" }),
    ).toHaveAccessibleDescription("Not applicable");
  });
});
