import { render } from "@testing-library/react";
import BroadcastListener from "@/components/BroadcastListener";
import { showBroadcastToast } from "@/components/BroadcastToast";
import { useSession } from "@/lib/context/SessionContext";
import { useBroadcastListener } from "@/lib/hooks/useBroadcastListener";

vi.mock("@/lib/context/SessionContext", () => ({ useSession: vi.fn() }));
vi.mock("@/lib/hooks/useBroadcastListener", () => ({
  useBroadcastListener: vi.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseSession = useSession as any;

describe("BroadcastListener", () => {
  beforeEach(() => vi.clearAllMocks());

  it("listens with the signed-in user's token and toasts each broadcast", () => {
    mockUseSession.mockReturnValue({ session: { access_token: "token-1" } });

    render(<BroadcastListener />);

    expect(useBroadcastListener).toHaveBeenCalledWith({
      accessToken: "token-1",
      onBroadcast: showBroadcastToast,
    });
  });

  it("does not listen while signed out", () => {
    mockUseSession.mockReturnValue({ session: null });

    render(<BroadcastListener />);

    expect(useBroadcastListener).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: null }),
    );
  });
});
