import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SidebarLayout from "@/components/layouts/SidebarLayout";

vi.mock("next/router", () => ({
  useRouter: () => ({ pathname: "/patient", push: vi.fn() }),
}));

vi.mock("@/lib/supabaseClient", () => ({
  supabase: { auth: { signOut: vi.fn() } },
}));

vi.mock("@/components/VillageSelector", () => ({
  default: () => <div />,
}));

describe("SidebarLayout mobile menu", () => {
  afterEach(() => {
    cleanup();
  });

  const getMobileMenu = () => screen.getByTestId("mobile-sidebar-menu");

  it("starts collapsed", () => {
    render(<SidebarLayout>content</SidebarLayout>);
    expect(getMobileMenu()).toHaveClass("hidden");
  });

  it("opens when the hamburger button is clicked", async () => {
    const user = userEvent.setup();
    render(<SidebarLayout>content</SidebarLayout>);

    await user.click(screen.getAllByRole("button")[0]);

    expect(getMobileMenu()).toHaveClass("flex");
    expect(getMobileMenu()).not.toHaveClass("hidden");
  });

  it("collapses after a nav item is clicked", async () => {
    const user = userEvent.setup();
    render(<SidebarLayout>content</SidebarLayout>);

    await user.click(screen.getAllByRole("button")[0]);
    const menu = getMobileMenu();
    await user.click(within(menu).getByRole("link", { name: /vitals/i }));

    expect(menu).toHaveClass("hidden");
  });
});
