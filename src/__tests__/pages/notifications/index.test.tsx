import {
  render,
  screen,
  cleanup,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast, Toaster } from "react-hot-toast";
import NotificationsPage from "@/pages/notifications";
import { trpc } from "@/utils/trpc";
import {
  assertLoadingSpinner,
  assertTableContents,
} from "@/__tests__/utils/helper-functions";
import { formatVisitDate } from "@/lib/utils/visit";

vi.mock("@/utils/trpc", () => ({
  trpc: {
    useUtils: vi.fn(),
    broadcastsRouter: {
      list: { useQuery: vi.fn() },
      send: { useMutation: vi.fn() },
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

const mockInvalidateList = vi.fn();
const mockSend = vi.fn();

/**
 * Mocks broadcasts.send. `result` decides which callback a send triggers,
 * run after the submit handler returns like a real network call.
 */
function mockSendMutation({
  isPending = false,
  result,
}: { isPending?: boolean; result?: "success" | "error" } = {}) {
  mockTrpc.broadcastsRouter.send.useMutation.mockImplementation(
    (options: { onSuccess: () => void; onError: (err: Error) => void }) => {
      mockSend.mockImplementation(() =>
        queueMicrotask(() => {
          if (result === "success") options.onSuccess();
          if (result === "error") options.onError(new Error("Network error"));
        }),
      );
      return { mutate: mockSend, isPending };
    },
  );
}

async function fillForm({
  title,
  body,
  severity,
}: {
  title: string;
  body: string;
  severity?: string;
}) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/Title/), title);
  await user.type(screen.getByLabelText(/Message/), body);
  if (severity) await user.click(screen.getByText(severity));
  return user;
}

describe("NotificationsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    toast.remove();
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockList({ data: MOCK_BROADCASTS });
    mockTrpc.useUtils.mockReturnValue({
      broadcastsRouter: { list: { invalidate: mockInvalidateList } },
    });
    mockSendMutation();
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

    it("renders every field of each broadcast as a card for mobile", () => {
      render(<NotificationsPage />);

      const cards = within(
        screen.getByRole("list", { name: "Broadcast history" }),
      ).getAllByRole("listitem");

      expect(cards.map((card) => card.textContent)).toEqual([
        `Critical${formatVisitDate(MOCK_BROADCASTS[0].createdAt)}Clinic closingPack up by 5pmFrom Alice`,
        `Warning${formatVisitDate(MOCK_BROADCASTS[1].createdAt)}Low stockParacetamol is running lowFrom Unknown`,
        `Info${formatVisitDate(MOCK_BROADCASTS[2].createdAt)}WelcomeHave a good tripFrom Bob`,
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
      expect(screen.queryByRole("list")).not.toBeInTheDocument();
    });

    it("shows an error state", () => {
      mockList({ isError: true });
      render(<NotificationsPage />);

      expect(
        screen.getByText("Failed to load broadcasts."),
      ).toBeInTheDocument();
    });
  });

  describe("compose form", () => {
    beforeEach(() => {
      // An empty history keeps severity labels unique on the page.
      mockList({ data: [] });
    });

    it("shows validation errors and does not send when title and body are empty", async () => {
      const user = userEvent.setup();
      render(<NotificationsPage />);

      await user.click(screen.getByRole("button", { name: "Send broadcast" }));

      expect(
        await screen.findByText("Please enter a title."),
      ).toBeInTheDocument();
      expect(screen.getByText("Please enter a message.")).toBeInTheDocument();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("treats whitespace-only fields as empty", async () => {
      render(<NotificationsPage />);

      const user = await fillForm({ title: "   ", body: "   " });
      await user.click(screen.getByRole("button", { name: "Send broadcast" }));

      expect(
        await screen.findByText("Please enter a title."),
      ).toBeInTheDocument();
      expect(mockSend).not.toHaveBeenCalled();
    });

    it("sends the trimmed payload, then resets the form, toasts and refreshes history", async () => {
      mockSendMutation({ result: "success" });
      render(
        <>
          <NotificationsPage />
          <Toaster />
        </>,
      );

      const user = await fillForm({
        title: "  Clinic closing ",
        body: "Pack up by 5pm",
        severity: "Critical",
      });
      await user.click(screen.getByRole("button", { name: "Send broadcast" }));

      expect(mockSend).toHaveBeenCalledWith({
        title: "Clinic closing",
        body: "Pack up by 5pm",
        severity: "critical",
      });
      expect(await screen.findByText("Broadcast sent!")).toBeInTheDocument();
      expect(mockInvalidateList).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.getByLabelText(/Title/)).toHaveValue("");
      });
      expect(screen.getByLabelText(/Message/)).toHaveValue("");
    });

    it("defaults severity to info", async () => {
      render(<NotificationsPage />);

      const user = await fillForm({ title: "Hi", body: "There" });
      await user.click(screen.getByRole("button", { name: "Send broadcast" }));

      expect(mockSend).toHaveBeenCalledWith({
        title: "Hi",
        body: "There",
        severity: "info",
      });
    });

    it("disables submit while sending", () => {
      mockSendMutation({ isPending: true });
      render(<NotificationsPage />);

      expect(screen.getByRole("button", { name: "Sending..." })).toBeDisabled();
    });

    it("keeps the form values and shows an error toast when sending fails", async () => {
      mockSendMutation({ result: "error" });
      render(
        <>
          <NotificationsPage />
          <Toaster />
        </>,
      );

      const user = await fillForm({ title: "Clinic closing", body: "5pm" });
      await user.click(screen.getByRole("button", { name: "Send broadcast" }));

      expect(
        await screen.findByText("Failed to send broadcast."),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Title/)).toHaveValue("Clinic closing");
      expect(screen.getByLabelText(/Message/)).toHaveValue("5pm");
      expect(mockInvalidateList).not.toHaveBeenCalled();
    });
  });
});
