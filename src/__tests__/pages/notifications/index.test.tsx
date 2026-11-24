import { render, screen, cleanup } from "@testing-library/react";
import NotificationsPage from "@/pages/notifications";
import { trpc } from "@/utils/trpc";
import {
  assertLoadingSpinner,
  assertTableContents,
} from "@/__tests__/utils/helper-functions";
import { formatVisitDate } from "@/lib/utils/visit";

vi.mock("@/utils/trpc", () => ({
  trpc: {
    broadcastsRouter: {
      list: { useQuery: vi.fn() },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTrpc = trpc as any;

// As returned by broadcasts.list: newest first.
const MOCK_BROADCASTS = [
  {
    id: 3,
    title: "Clinic closing",
    body: "Pack up by 5pm",
    severity: "critical",
    senderName: "Alice",
    createdAt: new Date("2026-06-22T14:30:00"),
  },
  {
    id: 2,
    title: "Low stock",
    body: "Paracetamol is running low",
    severity: "warning",
    senderName: null,
    createdAt: new Date("2026-06-21T09:05:00"),
  },
  {
    id: 1,
    title: "Welcome",
    body: "Have a good trip",
    severity: "info",
    senderName: "Bob",
    createdAt: new Date("2026-06-20T08:00:00"),
  },
];

function mockList(result: object) {
  mockTrpc.broadcastsRouter.list.useQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: false,
    ...result,
  });
}

describe("NotificationsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockList({ data: MOCK_BROADCASTS });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the page heading", () => {
    render(<NotificationsPage />);

    expect(
      screen.getByRole("heading", { name: "Notifications" }),
    ).toBeInTheDocument();
  });

  describe("history", () => {
    it("renders broadcasts newest first with a label per severity", () => {
      render(<NotificationsPage />);

      assertTableContents(screen.getByRole("table"), [
        ["Severity", "Title", "Body", "Sent by", "Sent at"],
        [
          "Critical",
          "Clinic closing",
          "Pack up by 5pm",
          "Alice",
          formatVisitDate(MOCK_BROADCASTS[0].createdAt),
        ],
        [
          "Warning",
          "Low stock",
          "Paracetamol is running low",
          "Unknown",
          formatVisitDate(MOCK_BROADCASTS[1].createdAt),
        ],
        [
          "Info",
          "Welcome",
          "Have a good trip",
          "Bob",
          formatVisitDate(MOCK_BROADCASTS[2].createdAt),
        ],
      ]);
    });

    it("shows a loading state", () => {
      mockList({ isLoading: true });
      render(<NotificationsPage />);

      assertLoadingSpinner("Loading broadcasts...");
    });

    it("shows an empty state", () => {
      mockList({ data: [] });
      render(<NotificationsPage />);

      expect(screen.getByText("No broadcasts yet")).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
    });

    it("shows an error state", () => {
      mockList({ isError: true });
      render(<NotificationsPage />);

      expect(
        screen.getByText("Failed to load broadcasts."),
      ).toBeInTheDocument();
    });
  });
});
