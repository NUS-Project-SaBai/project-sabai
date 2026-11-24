import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";
import type { NextRouter } from "next/router";
import PatientsBasePage from "@/pages/patient";

// Hoisted so the mock factory and the tests share one typed object.
const mockTrpc = vi.hoisted(() => ({
  patientsRouter: {
    listWithLatestVisit: { useQuery: vi.fn() },
  },
}));

vi.mock("@/utils/trpc", () => ({ trpc: mockTrpc }));

const MOCK_PATIENTS = [
  {
    id: 12,
    name: "Alice Tan",
    patientImageUrl: null,
    gender: "female",
    dateOfBirth: new Date("1990-01-01"),
    contactNo: "91234567",
    hasPoorCard: true,
    hasBS2Card: false,
    hasSabaiCard: false,
    drugAllergy: "Penicillin",
  },
  {
    id: 34,
    name: "Bob Lim",
    patientImageUrl: null,
    gender: "male",
    dateOfBirth: new Date("1985-06-15"),
    contactNo: null,
    hasPoorCard: false,
    hasBS2Card: true,
    hasSabaiCard: false,
    drugAllergy: "None",
  },
];

function createMockRouter(): NextRouter {
  return {
    basePath: "",
    pathname: "/patient",
    route: "/patient",
    query: {},
    asPath: "/patient",
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
    isFallback: false,
    push: vi.fn().mockResolvedValue(true),
    replace: vi.fn().mockResolvedValue(true),
    reload: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    beforePopState: vi.fn(),
    events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
  };
}

function renderWithRouter(router: NextRouter) {
  return render(
    <RouterContext.Provider value={router}>
      <PatientsBasePage />
    </RouterContext.Provider>,
  );
}

function getBodyRows() {
  const table = screen.getByRole("table");
  return within(table).getAllByRole("row").slice(1);
}

describe("PatientsBasePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTrpc.patientsRouter.listWithLatestVisit.useQuery.mockReturnValue({
      data: MOCK_PATIENTS,
      isLoading: false,
      isError: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("gives each patient a View link to their detail page", () => {
    // Given - two patients exist
    renderWithRouter(createMockRouter());
    // Then - each row's View link points at that patient's detail page
    const rows = getBodyRows();
    expect(rows).toHaveLength(2);
    expect(within(rows[0]).getByRole("link", { name: "View" })).toHaveAttribute(
      "href",
      "/patient/12",
    );
    expect(within(rows[1]).getByRole("link", { name: "View" })).toHaveAttribute(
      "href",
      "/patient/34",
    );
  });

  it("navigates to the clicked patient's detail page", async () => {
    // Given - two patients exist
    const router = createMockRouter();
    renderWithRouter(router);
    // When - the View button on the second patient's row is clicked
    const rows = getBodyRows();
    await userEvent.click(within(rows[1]).getByRole("link", { name: "View" }));
    // Then - the router navigates to that patient's detail page only
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith(
      "/patient/34",
      "/patient/34",
      expect.anything(),
    );
  });
});
