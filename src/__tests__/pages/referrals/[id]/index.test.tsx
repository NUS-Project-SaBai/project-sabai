import { cleanup, render, screen, within } from "@testing-library/react";
import { useRouter } from "next/router";
import ReferralDetailsPage from "@/pages/referrals/[id]";

vi.mock("next/router", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/components/layouts/withDefaultLayout", () => ({
  default: (page: React.ReactNode) => page,
}));

// Hoisted so the mock factory and the tests share one typed object.
const mockTrpc = vi.hoisted(() => ({
  useUtils: vi.fn(() => ({
    referralRouter: {
      list: { invalidate: vi.fn() },
      getById: { invalidate: vi.fn() },
    },
  })),
  referralRouter: {
    getById: { useQuery: vi.fn() },
    updateState: { useMutation: vi.fn() },
    updateOutcome: { useMutation: vi.fn() },
    updateBooth: { useMutation: vi.fn() },
  },
  referralPartnersRouter: {
    list: { useQuery: vi.fn(() => ({ data: [] })) },
  },
  usersRouter: {
    list: { useQuery: vi.fn(() => ({ data: [] })) },
  },
}));

vi.mock("@/utils/trpc", () => ({ trpc: mockTrpc }));

const DATE_OF_BIRTH = new Date("1990-05-17T00:00:00");

const MOCK_REFERRAL = {
  id: 11,
  referredFor: "Chronic",
  referralNotes: "Needs a cardiology review\nBring previous scans",
  referralState: "New",
  referralOutcome: null,
  consultId: 5,
  createdAt: new Date("2026-10-12T09:00:00"),
  consultDate: new Date("2026-10-12T08:30:00"),
  doctorId: "user-1",
  patientId: 12,
  patientName: "Alice Tan",
  patientDateOfBirth: DATE_OF_BIRTH,
  patientContactNo: "012 345 678",
  patientHasPoorCard: true,
  patientHasBS2Card: false,
  patientHasSabaiCard: true,
  patientImagePublicId: "p/alice",
  patientImageUrl: "https://img/p/alice",
  villageCodeId: 1,
  villageCode: "SB",
  villageColorHex: "#C0392B",
  referredToId: null,
  memberInChargeId: null,
  guardiansContacted: null,
  classOfService: null,
  descriptionOfService: null,
  patientSummaryFromScreening: null,
  remarksAtBooth: null,
};

function mockReferral(referral: Record<string, unknown> | null) {
  mockTrpc.referralRouter.getById.useQuery.mockReturnValue({
    data: referral,
    isLoading: false,
    isError: false,
  });
}

function getOverview() {
  return within(screen.getByRole("region", { name: "Patient Details" }));
}

// Returns the <dd> paired with a <dt> label in the overview section.
function getOverviewValue(label: string) {
  return getOverview().getByText(label).nextElementSibling as HTMLElement;
}

describe("ReferralDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      isReady: true,
      query: { id: "11" },
    } as unknown as ReturnType<typeof useRouter>);
    mockTrpc.referralRouter.updateState.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockTrpc.referralRouter.updateOutcome.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockTrpc.referralRouter.updateBooth.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockReferral(MOCK_REFERRAL);
  });

  afterEach(() => {
    cleanup();
  });

  it("opens the patient details section by default", () => {
    // Given - a referral is opened
    render(<ReferralDetailsPage />);
    // Then - the first accordion section is expanded
    expect(
      screen.getByRole("button", { name: "Patient Details" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("region", { name: "Patient Details" }),
    ).toBeVisible();
  });

  it("shows the patient's photo, name and code", () => {
    // Given - a referral is opened
    render(<ReferralDetailsPage />);
    // Then - the overview shows the patient's identity
    const overview = getOverview();
    expect(overview.getByAltText("Patient Photo")).toHaveAttribute(
      "src",
      "https://img/p/alice",
    );
    expect(overview.getByText("Alice Tan")).toBeInTheDocument();
    expect(overview.getByText("SB0012")).toBeInTheDocument();
  });

  it("shows date of birth, phone number, cards and referral details", () => {
    // Given - a referral for a patient with a POOR and a Sabai card
    render(<ReferralDetailsPage />);
    // Then - each field shows in the overview
    expect(getOverviewValue("Date of Birth")).toHaveTextContent(
      DATE_OF_BIRTH.toLocaleDateString(),
    );
    expect(getOverviewValue("Phone Number")).toHaveTextContent("012 345 678");

    const cards = within(getOverviewValue("Cards"))
      .getAllByRole("listitem")
      .map((card) => card.textContent);
    expect(cards).toEqual(["POOR", "Sabai Card"]);

    expect(getOverviewValue("Referral Type")).toHaveTextContent("Chronic");
    expect(getOverviewValue("Referral Notes")).toHaveTextContent(
      "Needs a cardiology review Bring previous scans",
    );
  });

  it("shows placeholders when the phone number, cards and notes are missing", () => {
    // Given - a patient with no phone number, no cards and no referral notes
    mockReferral({
      ...MOCK_REFERRAL,
      patientContactNo: null,
      patientHasPoorCard: false,
      patientHasSabaiCard: false,
      referralNotes: null,
    });
    render(<ReferralDetailsPage />);
    // Then - each missing field shows a placeholder
    expect(getOverviewValue("Phone Number")).toHaveTextContent("Not recorded");
    expect(getOverviewValue("Cards")).toHaveTextContent("No cards");
    expect(getOverviewValue("Referral Notes")).toHaveTextContent(
      "No notes entered",
    );
  });

  it("shows the referral booth section collapsed below patient details", () => {
    // Given - a referral is opened
    render(<ReferralDetailsPage />);
    // Then - the booth section is there but starts collapsed
    expect(
      screen.getByRole("button", { name: "Referral Booth" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("shows a not found message when the referral does not exist", () => {
    // Given - no referral matches the id
    mockReferral(null);
    render(<ReferralDetailsPage />);
    // Then - a not found message shows instead of the accordion
    expect(screen.getByText("Referral not found")).toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Patient Details" }),
    ).not.toBeInTheDocument();
  });
});
