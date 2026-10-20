import { render, screen } from "@testing-library/react";
import SettingsPage from "@/pages/settings";
import { assertBreadcrumbs } from "@/__tests__/utils/helper-functions";

describe("SettingsPage", () => {
  it("renders header and links to village codes", () => {
    render(<SettingsPage />);

    expect(
      screen.getByRole("heading", { name: "Settings" }),
    ).toBeInTheDocument();
    assertBreadcrumbs(["Home", "Settings"]);
    expect(screen.getByRole("link", { name: "Village Codes" })).toHaveAttribute(
      "href",
      "/settings/village-codes",
    );
  });
});
