import { render, screen } from "@testing-library/react";
import SidebarLayout from "@/components/layouts/SidebarLayout";

const router = vi.hoisted(() => ({ pathname: "/patient", push: vi.fn() }));

vi.mock("next/router", () => ({ useRouter: () => router }));

vi.mock("@/lib/supabaseClient", () => ({
  supabase: { auth: { signOut: vi.fn() } },
}));

vi.mock("@/components/VillageSelector", () => ({
  default: () => null,
}));

// The nav list renders twice: desktop sidebar and mobile menu.
const navLinks = (name: string) => screen.getAllByRole("link", { name });

describe("SidebarLayout", () => {
  beforeEach(() => {
    router.pathname = "/patient";
  });

  it("links the Notifications nav item to the notifications page", () => {
    render(<SidebarLayout>page</SidebarLayout>);

    for (const link of navLinks("Notifications")) {
      expect(link).toHaveAttribute("href", "/notifications");
    }
  });

  it("highlights Notifications only on the notifications page", () => {
    router.pathname = "/notifications";
    render(<SidebarLayout>page</SidebarLayout>);

    for (const link of navLinks("Notifications")) {
      expect(link).toHaveClass("bg-secondary-50");
    }
    for (const link of navLinks("Settings")) {
      expect(link).not.toHaveClass("bg-secondary-50");
    }
  });
});
