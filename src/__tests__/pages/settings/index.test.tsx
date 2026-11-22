import { render, screen } from "@testing-library/react";
import SettingsPage from "@/pages/settings";
import { assertBreadcrumbs } from "@/__tests__/utils/helper-functions";

describe("SettingsPage", () => {
  it("links to referral partners", () => {
    render(<SettingsPage />);

    expect(
      screen.getByRole("link", { name: "Referral Partners" }),
    ).toHaveAttribute("href", "/settings/referral-partners");
    expect(screen.getByText("Manage referral partners.")).toBeInTheDocument();
  });

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
