import { cleanup, render, screen } from "@testing-library/react";
import ReferralsLayout from "@/components/referrals/ReferralsLayout";

const mockTrpc = vi.hoisted(() => ({
  referralRouter: {
    list: { useQuery: vi.fn() },
  },
}));

vi.mock("@/utils/trpc", () => ({ trpc: mockTrpc }));

// Capture the link builder handed to the search bar instead of rendering the
// real search, which needs the patients context.
const captured = vi.hoisted(() => ({
  getPatientLink: undefined as ((patientId: number) => string) | undefined,
}));

vi.mock("@/components/layouts/PatientTopMenuLayout", () => ({
  default: ({
    children,
    getPatientLink,
  }: {
    children: React.ReactNode;
    getPatientLink?: (patientId: number) => string;
  }) => {
    captured.getPatientLink = getPatientLink;
    return <>{children}</>;
  },
}));

describe("ReferralsLayout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    captured.getPatientLink = undefined;
    // Newest first, as referralRouter.list returns them.
    mockTrpc.referralRouter.list.useQuery.mockReturnValue({
      data: [
        { id: 30, patientId: 12 },
        { id: 20, patientId: 34 },
        { id: 10, patientId: 12 },
      ],
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the page inside the search bar layout", () => {
    // Given - a page wrapped in the referrals layout
    render(
      <ReferralsLayout>
        <p>Page content</p>
      </ReferralsLayout>,
    );
    // Then - the page renders
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("links a searched patient to their latest referral", () => {
    // Given - patient 12 has two referrals
    render(<ReferralsLayout>{null}</ReferralsLayout>);
    // Then - the search result links to the newest one
    expect(captured.getPatientLink!(12)).toBe("/referrals/30");
  });

  it("links a patient with no referrals to their patient page", () => {
    // Given - patient 99 has never been referred
    render(<ReferralsLayout>{null}</ReferralsLayout>);
    // Then - the search result links to the patient page
    expect(captured.getPatientLink!(99)).toBe("/patient/99");
  });
});
