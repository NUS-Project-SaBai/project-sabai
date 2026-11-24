import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import toast from "react-hot-toast";
import { showBroadcastToast } from "@/components/BroadcastToast";
import type { BroadcastNotification } from "@/lib/validation/broadcasts";

vi.mock("react-hot-toast", () => ({
  default: Object.assign(vi.fn(), { dismiss: vi.fn() }),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockToast = toast as any;

function broadcast(
  severity: BroadcastNotification["severity"],
  overrides: Partial<BroadcastNotification> = {},
): BroadcastNotification {
  return {
    id: 11,
    title: "Clinic closes early",
    body: "Pack up by 3pm.",
    severity,
    senderName: "Dr Lim",
    ...overrides,
  };
}

/** Renders the content passed to toast() and returns its options. */
function show(payload: BroadcastNotification) {
  showBroadcastToast(payload);
  const [content, options] = mockToast.mock.calls[0];
  render(content({ id: options.id }));
  return options;
}

describe("showBroadcastToast", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ["info", "border-2 border-info", undefined],
    ["warning", "border-2 border-warning", 8000],
    ["critical", "border-2 border-danger", Infinity],
  ] as const)(
    "gives %s toasts their outline class and display time",
    (severity, className, duration) => {
      const options = show(broadcast(severity));

      expect(options).toMatchObject({
        id: "broadcast-11",
        className,
        duration,
      });
    },
  );

  it("shows severity, title, body and sender as plain text", () => {
    show(broadcast("info", { title: "<b>Evacuate</b>" }));

    expect(screen.getByText("info")).toBeInTheDocument();
    expect(screen.getByText("<b>Evacuate</b>")).toBeInTheDocument();
    expect(screen.getByText("Pack up by 3pm.")).toBeInTheDocument();
    expect(screen.getByText("From Dr Lim")).toBeInTheDocument();
  });

  it("only critical toasts have a dismiss button, and it dismisses", async () => {
    show(broadcast("critical"));

    await userEvent.click(
      screen.getByRole("button", { name: "Dismiss notification" }),
    );
    expect(mockToast.dismiss).toHaveBeenCalledWith("broadcast-11");
  });

  it("non-critical toasts have no dismiss button", () => {
    show(broadcast("warning"));

    expect(
      screen.queryByRole("button", { name: "Dismiss notification" }),
    ).not.toBeInTheDocument();
  });
});
