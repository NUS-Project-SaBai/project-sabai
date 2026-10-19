import userEvent from "@testing-library/user-event";
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import ReferralsPage from "@/pages/referrals";
import {
  assertBreadcrumbs,
  assertLoadingSpinner,
} from "@/__tests__/utils/helper-functions";

// Hoisted so the mock factory and the tests share one typed object.
const mockTrpc = vi.hoisted(() => ({
  useUtils: vi.fn(() => ({
    referralRouter: {
      list: { invalidate: vi.fn() },
      getById: { invalidate: vi.fn() },
    },
  })),
  referralRouter: {
    list: { useQuery: vi.fn() },
    updateState: { useMutation: vi.fn() },
  },
}));

vi.mock("@/utils/trpc", () => ({ trpc: mockTrpc }));

vi.mock("@/lib/context/VillageCodeContext", () => ({
  useVillageCode: () => ({
    villageCodes: [
      { id: 1, code: "SB", name: "Sabai", colorHex: "#C0392B" },
      { id: 2, code: "PC", name: "Pa Chi", colorHex: "#2E86C1" },
    ],
  }),
}));

const MOCK_REFERRALS = [
  {
    id: 11,
    referredFor: "Chronic",
    referralNotes: "Follow up",
    referralState: "New",
    referralOutcome: null,
    consultId: 5,
    createdAt: new Date("2026-10-12T09:00:00"),
    consultDate: new Date("2026-10-12T08:30:00"),
    doctorId: "user-1",
    patientId: 12,
    patientName: "Alice Tan",
    patientImagePublicId: "p/alice",
    patientImageUrl: "https://img/p/alice",
    villageCodeId: 1,
    villageCode: "SB",
    villageColorHex: "#C0392B",
  },
  {
    id: 10,
    referredFor: "Acute",
    referralNotes: null,
    referralState: "Seen",
    referralOutcome: null,
    consultId: 4,
    createdAt: new Date("2026-10-11T09:00:00"),
    consultDate: new Date("2026-10-11T08:30:00"),
    doctorId: "user-1",
    patientId: 34,
    patientName: "Bob Lim",
    patientImagePublicId: "p/bob",
    patientImageUrl: "https://img/p/bob",
    villageCodeId: 2,
    villageCode: "PC",
    villageColorHex: "#2E86C1",
  },
];

function mockList(result: Record<string, unknown>) {
  mockTrpc.referralRouter.list.useQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    ...result,
  });
}

function getBodyRows() {
  const table = screen.getByRole("table");
  return within(table).getAllByRole("row").slice(1);
}

describe("ReferralsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTrpc.referralRouter.updateState.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockList({ data: MOCK_REFERRALS });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the title and breadcrumbs", () => {
    // Given - the referrals page is opened
    render(<ReferralsPage />);
    // Then - the title and Home / Referrals breadcrumbs show
    expect(
      screen.getByRole("heading", { name: "Referrals" }),
    ).toBeInTheDocument();
    assertBreadcrumbs(["Home", "Referrals"]);
  });

  it("shows a loading spinner while referrals load", () => {
    // Given - the referral list is still loading
    mockList({ isLoading: true });
    render(<ReferralsPage />);
    // Then - a loading spinner shows
    assertLoadingSpinner("Loading referrals...");
  });

  it("shows an error message when loading fails", () => {
    // Given - the referral list failed to load
    mockList({ isError: true });
    render(<ReferralsPage />);
    // Then - an error message shows
    expect(screen.getByText("An error has occurred!")).toBeInTheDocument();
  });

  it("explains where referrals come from when there are none", () => {
    // Given - there are no referrals yet
    mockList({ data: [] });
    render(<ReferralsPage />);
    // Then - the empty state says referrals come from consults
    expect(
      screen.getByText(
        "No referrals yet. Referrals made during consults will appear here.",
      ),
    ).toBeInTheDocument();
  });

  it("lists each referral with its patient summary and actions", () => {
    // Given - two referrals exist
    render(<ReferralsPage />);
    // Then - each gets a row with patient code, name, referral reason, links and status
    const rows = getBodyRows();
    expect(rows).toHaveLength(2);

    const first = within(rows[0]);
    expect(first.getByText("SB0012")).toBeInTheDocument();
    expect(first.getByText("Alice Tan")).toBeInTheDocument();
    expect(first.getByText("Referred for: Chronic")).toBeInTheDocument();
    expect(
      first.getByRole("link", { name: "Referral Details" }),
    ).toHaveAttribute("href", "/referrals/11");
    expect(first.getByRole("link", { name: "Go to consult" })).toHaveAttribute(
      "href",
      "/consults/12",
    );
    expect(
      first.getByRole("combobox", { name: "Referral status" }),
    ).toHaveValue("New");
  });

  it("filters by patient name", async () => {
    // Given - referrals for Alice Tan and Bob Lim
    render(<ReferralsPage />);
    // When - the user searches for "bob"
    await userEvent.type(
      screen.getByPlaceholderText("Search patients..."),
      "bob",
    );
    // Then - only Bob's referral remains (search is debounced, so wait for it)
    await waitFor(() => expect(getBodyRows()).toHaveLength(1));
    expect(screen.getByText("PC0034")).toBeInTheDocument();
  });

  it("filters by patient code", async () => {
    // Given - referrals for Alice Tan (SB0012) and Bob Lim (PC0034)
    render(<ReferralsPage />);
    // When - the user searches for Alice's code in lower case
    await userEvent.type(
      screen.getByPlaceholderText("Search patients..."),
      "sb0012",
    );
    // Then - only Alice's referral remains
    await waitFor(() =>
      expect(screen.queryByText("Bob Lim")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Alice Tan")).toBeInTheDocument();
  });

  it("filters by village", async () => {
    // Given - referrals from village SB (Alice) and village PC (Bob)
    render(<ReferralsPage />);
    // When - the user picks village PC
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Village" }),
      "2",
    );
    // Then - only Bob's referral remains
    expect(getBodyRows()).toHaveLength(1);
    expect(screen.getByText("Bob Lim")).toBeInTheDocument();
  });

  it("says when no referrals match the filters", async () => {
    // Given - two referrals exist
    render(<ReferralsPage />);
    // When - the user searches for a name that matches neither
    await userEvent.type(
      screen.getByPlaceholderText("Search patients..."),
      "nobody",
    );
    // Then - a no-matches message shows
    expect(
      await screen.findByText("No referrals match your search."),
    ).toBeInTheDocument();
  });
});
