import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReferralPartnersPage from "@/pages/settings/referral-partners";
import { trpc } from "@/utils/trpc";
import {
  assertBreadcrumbs,
  assertLoadingSpinner,
  assertTableContents,
} from "@/__tests__/utils/helper-functions";
import { Toaster, toast } from "react-hot-toast";

const ACTIVE_PARTNER = {
  id: "8f14e45f-ceea-4e7a-9b1c-1a2b3c4d5e6f",
  name: "Angkor Hospital",
  remarks: "Paediatrics only",
  isActive: true,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

const INACTIVE_PARTNER = {
  id: "c9f0f895-fb98-4b91-9c2d-2b3c4d5e6f70",
  name: "Battambang Clinic",
  remarks: null,
  isActive: false,
  createdAt: new Date("2026-01-02"),
  updatedAt: new Date("2026-01-02"),
};

const mockPartners = [ACTIVE_PARTNER, INACTIVE_PARTNER];

vi.mock("@/utils/trpc", () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      referralPartnersRouter: {
        list: {
          invalidate: vi.fn(),
        },
      },
    })),
    referralPartnersRouter: {
      list: { useQuery: vi.fn() },
      create: { useMutation: vi.fn() },
      update: { useMutation: vi.fn() },
      delete: { useMutation: vi.fn() },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTrpc = trpc as any;

// Makes a mutation hook call the given callback as soon as mutate() is called.
function mockMutationCalling(
  hook: "create" | "update" | "delete",
  callback: "onSuccess" | "onError",
  mutate = vi.fn(),
) {
  mockTrpc.referralPartnersRouter[hook].useMutation.mockImplementation(
    (opts: { onSuccess?: () => void; onError?: (err: Error) => void }) => ({
      mutate: vi.fn((input) => {
        mutate(input);
        if (callback === "onSuccess") opts.onSuccess?.();
        else opts.onError?.(new Error("db error"));
      }),
      isPending: false,
    }),
  );
  return mutate;
}

function renderPage() {
  return render(
    <>
      <ReferralPartnersPage />
      <Toaster toastOptions={{ duration: 100 }} />
    </>,
  );
}

describe("ReferralPartnersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toast.dismissAll();

    for (const hook of ["create", "update", "delete"] as const) {
      mockTrpc.referralPartnersRouter[hook].useMutation.mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
      });
    }

    mockTrpc.referralPartnersRouter.list.useQuery.mockReturnValue({
      data: mockPartners,
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders page title and breadcrumbs", () => {
    render(<ReferralPartnersPage />);

    expect(
      screen.getByRole("heading", { name: "Referral Partners" }),
    ).toBeInTheDocument();
    assertBreadcrumbs(["Home", "Settings", "Referral Partners"]);
  });

  it("displays loading state", () => {
    mockTrpc.referralPartnersRouter.list.useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<ReferralPartnersPage />);

    assertLoadingSpinner("Loading referral partners...");
  });

  it("displays an empty message when there are no referral partners", () => {
    mockTrpc.referralPartnersRouter.list.useQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<ReferralPartnersPage />);

    expect(
      screen.getByText(
        "No referral partner found. Add a new record to get started.",
      ),
    ).toBeInTheDocument();
  });

  it("displays referral partners in the table", () => {
    render(<ReferralPartnersPage />);

    assertTableContents(screen.getByRole("table"), [
      ["Name", "Remarks", "Active", "Actions"],
      ["Angkor Hospital", "Paediatrics only", "", "EditDelete"],
      ["Battambang Clinic", "", "", "EditDelete"],
    ]);
  });

  it("shows is_active as a read-only checkbox", async () => {
    const user = userEvent.setup();
    render(<ReferralPartnersPage />);

    const activeBox = screen.getByRole("checkbox", {
      name: "Angkor Hospital is active",
    });
    const inactiveBox = screen.getByRole("checkbox", {
      name: "Battambang Clinic is active",
    });

    expect(activeBox).toBeChecked();
    expect(activeBox).toBeDisabled();
    expect(inactiveBox).not.toBeChecked();
    expect(inactiveBox).toBeDisabled();

    await user.click(activeBox);
    expect(activeBox).toBeChecked();
  });

  it("switches only the selected row to edit mode, and back on cancel", async () => {
    const user = userEvent.setup();
    const { container } = render(<ReferralPartnersPage />);

    expect(container.querySelector('input[name="name"]')).toBeNull();

    const [firstRow] = screen.getAllByRole("row").slice(1);
    await user.click(within(firstRow).getByRole("button", { name: "Edit" }));

    expect(container.querySelectorAll('input[name="name"]')).toHaveLength(1);
    expect(container.querySelector('input[name="remarks"]')).not.toBeNull();
    expect(
      screen.getByRole("checkbox", { name: "Angkor Hospital is active" }),
    ).toBeEnabled();

    await user.click(within(firstRow).getByRole("button", { name: "Cancel" }));

    expect(container.querySelector('input[name="name"]')).toBeNull();
    expect(screen.getByText("Angkor Hospital")).toBeInTheDocument();
  });

  it("rejects a save when nothing has changed", async () => {
    const user = userEvent.setup();
    renderPage();

    const [firstRow] = screen.getAllByRole("row").slice(1);
    await user.click(within(firstRow).getByRole("button", { name: "Edit" }));
    await user.click(within(firstRow).getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "No form field changed!",
    );
  });

  it("shows a validation error when the name is cleared", async () => {
    const user = userEvent.setup();
    const { container } = render(<ReferralPartnersPage />);

    const [firstRow] = screen.getAllByRole("row").slice(1);
    await user.click(within(firstRow).getByRole("button", { name: "Edit" }));
    await user.clear(
      container.querySelector('input[name="name"]') as HTMLInputElement,
    );
    await user.click(within(firstRow).getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Please input a name.")).toBeInTheDocument();
  });

  it("submits edited fields, including is_active, and shows a success toast", async () => {
    const user = userEvent.setup();
    const mutate = mockMutationCalling("update", "onSuccess");
    const { container } = renderPage();

    const [firstRow] = screen.getAllByRole("row").slice(1);
    await user.click(within(firstRow).getByRole("button", { name: "Edit" }));

    const remarksInput = container.querySelector(
      'input[name="remarks"]',
    ) as HTMLInputElement;
    await user.clear(remarksInput);
    await user.type(remarksInput, "All departments");
    await user.click(
      screen.getByRole("checkbox", { name: "Angkor Hospital is active" }),
    );
    await user.click(within(firstRow).getByRole("button", { name: "Save" }));

    expect(mutate).toHaveBeenCalledWith({
      id: ACTIVE_PARTNER.id,
      name: "Angkor Hospital",
      remarks: "All departments",
      isActive: false,
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Successfully updated!",
    );
    expect(container.querySelector('input[name="name"]')).toBeNull();
  });

  it("shows the partner's details in the delete confirmation modal and closes on cancel", async () => {
    const user = userEvent.setup();
    render(<ReferralPartnersPage />);

    const [firstRow] = screen.getAllByRole("row").slice(1);
    await user.click(within(firstRow).getByRole("button", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Angkor Hospital")).toBeInTheDocument();
    expect(within(dialog).getByText("Paediatrics only")).toBeInTheDocument();
    expect(within(dialog).getByText("Yes")).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("deletes the partner on confirm and shows a success toast", async () => {
    const user = userEvent.setup();
    const mutate = mockMutationCalling("delete", "onSuccess");
    renderPage();

    const [firstRow] = screen.getAllByRole("row").slice(1);
    await user.click(within(firstRow).getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

    expect(mutate).toHaveBeenCalledWith({ id: ACTIVE_PARTNER.id });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Successfully deleted.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows an error toast and closes the modal when deletion fails", async () => {
    const user = userEvent.setup();
    mockMutationCalling("delete", "onError");
    renderPage();

    const [firstRow] = screen.getAllByRole("row").slice(1);
    await user.click(within(firstRow).getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Unable to delete referral partner.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("creates a new referral partner from the add modal", async () => {
    const user = userEvent.setup();
    const mutate = mockMutationCalling("create", "onSuccess");
    renderPage();

    await user.click(
      screen.getByRole("button", { name: "Add Referral Partner" }),
    );
    const dialog = await screen.findByRole("dialog");
    expect(
      within(dialog).getByRole("heading", { name: "Add New Referral Partner" }),
    ).toBeInTheDocument();

    const nameInput = dialog.querySelector(
      'input[name="name"]',
    ) as HTMLInputElement;
    await user.type(nameInput, "Siem Reap Provincial Hospital");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(mutate).toHaveBeenCalledWith({
      name: "Siem Reap Provincial Hospital",
      remarks: "",
      isActive: true,
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Successfully created!",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("requires a name in the add modal", async () => {
    const user = userEvent.setup();
    const mutate = mockMutationCalling("create", "onSuccess");
    render(<ReferralPartnersPage />);

    await user.click(
      screen.getByRole("button", { name: "Add Referral Partner" }),
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(
      await within(dialog).findByText("Missing Name!"),
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });
});
