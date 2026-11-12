import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccordionSection } from "@/components/interactive/Accordion";

describe("AccordionSection", () => {
  afterEach(() => {
    cleanup();
  });

  it("starts collapsed by default", () => {
    // Given - a section without defaultOpen
    render(
      <AccordionSection title="Booth">
        <p>Booth content</p>
      </AccordionSection>,
    );
    // Then - the header is collapsed and the content is hidden
    expect(screen.getByRole("button", { name: "Booth" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.queryByText("Booth content")).not.toBeVisible();
  });

  it("starts expanded when defaultOpen is set", () => {
    // Given - a section with defaultOpen
    render(
      <AccordionSection title="Booth" defaultOpen>
        <p>Booth content</p>
      </AccordionSection>,
    );
    // Then - the content shows in a region labelled by the header
    expect(screen.getByRole("region", { name: "Booth" })).toBeVisible();
    expect(screen.getByText("Booth content")).toBeVisible();
  });

  it("toggles open and closed when the header is clicked", async () => {
    // Given - a collapsed section
    const user = userEvent.setup();
    render(
      <AccordionSection title="Booth">
        <p>Booth content</p>
      </AccordionSection>,
    );
    const header = screen.getByRole("button", { name: "Booth" });
    // When - the header is clicked
    await user.click(header);
    // Then - it expands
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Booth content")).toBeVisible();
    // When - the header is clicked again
    await user.click(header);
    // Then - it collapses
    expect(header).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Booth content")).not.toBeVisible();
  });
});
