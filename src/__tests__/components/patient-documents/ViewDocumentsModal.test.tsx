import { cleanup, render, screen } from "@testing-library/react";
import ViewDocumentsModal from "@/components/patient-documents/ViewDocumentsModal";

const { mockTrpc } = vi.hoisted(() => ({
  mockTrpc: { filesRouter: { listByPatientId: { useQuery: vi.fn() } } },
}));

vi.mock("@/utils/trpc", () => ({ trpc: mockTrpc }));

const useQuery = mockTrpc.filesRouter.listByPatientId.useQuery;

function mockQuery(result: {
  data?: unknown[];
  isLoading?: boolean;
  isError?: boolean;
}) {
  useQuery.mockReturnValue({ isLoading: false, isError: false, ...result });
}

// Modal opens the <dialog> inside a requestAnimationFrame; wait for its title.
async function renderModal() {
  render(<ViewDocumentsModal patientId={7} onClose={() => {}} />);
  await screen.findByRole("heading", { name: "View Documents" });
}

describe("ViewDocumentsModal", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("fetches the patient's files fresh each time it opens", async () => {
    mockQuery({ data: [] });
    await renderModal();

    expect(useQuery).toHaveBeenCalledWith(
      { patientId: 7 },
      expect.objectContaining({ refetchOnMount: "always" }),
    );
  });

  it("shows a spinner while loading", async () => {
    mockQuery({ isLoading: true });
    await renderModal();

    expect(screen.getByText("Loading documents...")).toBeInTheDocument();
  });

  it("shows an error when the list can't load", async () => {
    mockQuery({ isError: true });
    await renderModal();

    expect(screen.getByText("Could not load documents.")).toBeInTheDocument();
  });

  it("says when there are no documents", async () => {
    mockQuery({ data: [] });
    await renderModal();

    expect(screen.getByText("No documents found.")).toBeInTheDocument();
  });

  it("links each document and falls back when it has no description", async () => {
    mockQuery({
      data: [
        {
          id: 1,
          fileName: "letter.pdf",
          description: "Referral letter",
          fileUrl: "https://s3.example.com/letter",
          createdAt: new Date("2026-11-22T10:00:00Z"),
        },
        {
          id: 2,
          fileName: "xray.png",
          description: "",
          fileUrl: "https://s3.example.com/xray",
          createdAt: new Date("2026-11-22T11:00:00Z"),
        },
      ],
    });
    await renderModal();

    const link = screen.getByRole("link", { name: "letter.pdf" });
    expect(link).toHaveAttribute("href", "https://s3.example.com/letter");
    expect(link).toHaveAttribute("target", "_blank");
    expect(screen.getByText("Referral letter")).toBeInTheDocument();
    expect(screen.getByText("No description")).toBeInTheDocument();
  });
});
