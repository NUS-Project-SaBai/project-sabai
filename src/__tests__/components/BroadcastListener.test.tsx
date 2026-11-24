import { render } from "@testing-library/react";
import BroadcastListener from "@/components/BroadcastListener";
import { showBroadcastToast } from "@/components/BroadcastToast";
import { useSession } from "@/lib/context/SessionContext";
import { useBroadcastListener } from "@/lib/hooks/useBroadcastListener";

vi.mock("@/lib/context/SessionContext", () => ({ useSession: vi.fn() }));
vi.mock("@/lib/hooks/useBroadcastListener", () => ({
  useBroadcastListener: vi.fn(),
}));
vi.mock("@/components/BroadcastToast", () => ({ showBroadcastToast: vi.fn() }));

const mockInvalidateList = vi.fn();
vi.mock("@/utils/trpc", () => ({
  trpc: {
    useUtils: () => ({
      broadcastsRouter: { list: { invalidate: mockInvalidateList } },
    }),
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseSession = useSession as any;

describe("BroadcastListener", () => {
  beforeEach(() => vi.clearAllMocks());

  it("listens with the signed-in user's token", () => {
    mockUseSession.mockReturnValue({ session: { access_token: "token-1" } });

    render(<BroadcastListener />);

    expect(useBroadcastListener).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: "token-1" }),
    );
  });

  it("toasts each broadcast and refreshes the history list", () => {
    mockUseSession.mockReturnValue({ session: { access_token: "token-1" } });
    render(<BroadcastListener />);

    const broadcast = {
      id: 1,
      title: "Low stock",
      body: "Paracetamol is running low",
      severity: "warning" as const,
      senderName: "Alice",
    };
    vi.mocked(useBroadcastListener).mock.calls[0][0].onBroadcast(broadcast);

    expect(showBroadcastToast).toHaveBeenCalledWith(broadcast);
    expect(mockInvalidateList).toHaveBeenCalled();
  });

  it("does not listen while signed out", () => {
    mockUseSession.mockReturnValue({ session: null });

    render(<BroadcastListener />);

    expect(useBroadcastListener).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: null }),
    );
  });
});
