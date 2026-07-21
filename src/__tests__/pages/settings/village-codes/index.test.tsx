import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VillageCodesPage from "@/pages/settings/village-codes";
import { trpc } from "@/utils/trpc";
import { toast, Toaster } from "react-hot-toast";
import { assertLoadingSpinner } from "@/__tests__/utils/helper-functions";

// Mock tRPC
vi.mock("@/utils/trpc", () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      villageCodesRouter: {
        list: {
          invalidate: vi.fn(),
        },
      },
    })),
    villageCodesRouter: {
      list: {
        useQuery: vi.fn(),
      },
      create: {
        useMutation: vi.fn(),
      },
      update: {
        useMutation: vi.fn(),
      },
      delete: {
        useMutation: vi.fn(),
      },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTrpc = trpc as any;

const MOCK_VILLAGE_CODES = {
  PC: {
    id: 1,
    code: "PC",
    name: "PC Village",
    colorHex: "#FF5733",
    isVisible: true,
  },
  CA: {
    id: 2,
    code: "CA",
    name: "CA Village",
    colorHex: "#3498DB",
    isVisible: true,
  },
  TK: {
    code: "TK",
    name: "TK Village",
    colorHex: "#2ECC71",
    isVisible: false,
  },
  SC: {
    code: "SC",
    name: "SC Village",
  },
} as const;

const FORM_PLACEHOLDERS = {
  CODE: "e.g. V001",
  NAME: "Central Village",
} as const;

const mockVillageCodes = [
  MOCK_VILLAGE_CODES.PC,
  MOCK_VILLAGE_CODES.CA,
  MOCK_VILLAGE_CODES.TK,
];

describe("VillageCodesPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    toast.remove(); // remove actually removes everything immediately.
    //dismiss might cause conflicts if multiple testcases are using toasts.

    // Mock the mutations with default implementations
    mockTrpc.villageCodesRouter.create.useMutation.mockReturnValue({
      mutate: vi.fn(),
    });
    mockTrpc.villageCodesRouter.update.useMutation.mockReturnValue({
      mutate: vi.fn(),
    });
    mockTrpc.villageCodesRouter.delete.useMutation.mockReturnValue({
      mutate: vi.fn(),
    });

    mockTrpc.villageCodesRouter.list.useQuery.mockImplementation(
      ({ includeHidden = false }: { includeHidden?: boolean } = {}) => ({
        data: includeHidden
          ? mockVillageCodes
          : mockVillageCodes.filter((vc) => vc.isVisible),
        isLoading: false,
      }),
    );
  });

  afterEach(() => {
    cleanup();
  });

  it("renders page title and breadcrumbs", () => {
    render(<VillageCodesPage />);

    expect(
      screen.getByRole("heading", { name: "Village Codes" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("displays loading state", () => {
    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<VillageCodesPage />);

    assertLoadingSpinner("Loading Village Codes...");
  });

  it("displays village codes in table", () => {
    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: mockVillageCodes,
      isLoading: false,
    });

    render(<VillageCodesPage />);

    expect(screen.getByText(MOCK_VILLAGE_CODES.PC.code)).toBeInTheDocument();
    expect(screen.getByText(MOCK_VILLAGE_CODES.PC.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_VILLAGE_CODES.CA.code)).toBeInTheDocument();
    expect(screen.getByText(MOCK_VILLAGE_CODES.CA.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_VILLAGE_CODES.TK.code)).toBeInTheDocument();
    expect(screen.getByText(MOCK_VILLAGE_CODES.TK.name)).toBeInTheDocument();
  });

  it("opens new village code form when button is clicked", async () => {
    const user = userEvent.setup();
    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: mockVillageCodes,
      isLoading: false,
    });

    render(<VillageCodesPage />);

    await user.click(screen.getByRole("button", { name: "New Village Code" }));

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "New Village Code" }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByPlaceholderText(FORM_PLACEHOLDERS.CODE),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(FORM_PLACEHOLDERS.NAME),
    ).toBeInTheDocument();
  });

  it("opens edit form when edit button is clicked", async () => {
    const user = userEvent.setup();
    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: mockVillageCodes,
      isLoading: false,
    });

    render(<VillageCodesPage />);

    await user.click(screen.getAllByText("Edit")[0]);

    await waitFor(() => {
      expect(screen.getByText("Edit Village Code")).toBeInTheDocument();
    });
    expect(
      screen.getByDisplayValue(MOCK_VILLAGE_CODES.PC.name),
    ).toBeInTheDocument();
  });

  it("shows a success toast when a village code has been successfully edited", async () => {
    const user = userEvent.setup();

    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: mockVillageCodes,
      isLoading: false,
    });

    mockTrpc.villageCodesRouter.update.useMutation.mockImplementation(
      ({ onSuccess }) => {
        return {
          mutate: vi.fn(() => {
            onSuccess?.(); // call it immediately when mutate is called
          }),
          isLoading: false,
        };
      },
    );

    render(
      <>
        <VillageCodesPage />
        <Toaster toastOptions={{ duration: 100 }} />
      </>,
    );

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);

    await waitFor(() => {
      expect(screen.getByText("Edit Village Code")).toBeInTheDocument();
    });

    const codeInput = document.querySelector('input[name="code"]');
    expect(codeInput).toBeInTheDocument();
    await user.type(codeInput!, "1111");

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save" }));

    const toastEl = screen.getByRole("status");

    expect(toastEl).toBeInTheDocument();
    expect(toastEl).toHaveTextContent("Village code updated!");
  });

  it("closes form when cancel button is clicked", async () => {
    const user = userEvent.setup();
    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: mockVillageCodes,
      isLoading: false,
    });

    render(<VillageCodesPage />);

    await user.click(screen.getByRole("button", { name: "New Village Code" }));
    await waitFor(
      () => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("submits new village code form with correct data", async () => {
    const user = userEvent.setup();
    const mockCreate = vi.fn();
    mockTrpc.villageCodesRouter.create.useMutation.mockReturnValue({
      mutate: mockCreate,
    });
    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: mockVillageCodes,
      isLoading: false,
    });

    render(<VillageCodesPage />);

    await user.click(screen.getByRole("button", { name: "New Village Code" }));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(FORM_PLACEHOLDERS.CODE),
      ).toBeInTheDocument();
    });

    await user.type(
      screen.getByPlaceholderText(FORM_PLACEHOLDERS.CODE),
      MOCK_VILLAGE_CODES.SC.code,
    );
    await user.type(
      screen.getByPlaceholderText(FORM_PLACEHOLDERS.NAME),
      MOCK_VILLAGE_CODES.SC.name,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mockCreate).toHaveBeenCalledWith({
      code: MOCK_VILLAGE_CODES.SC.code,
      name: MOCK_VILLAGE_CODES.SC.name,
      colorHex: "#3b82f6", // This is the default color that the form uses
      isVisible: true,
    });
  });

  it("shows a success toast when a new village code has been successfully created", async () => {
    const user = userEvent.setup();

    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: mockVillageCodes,
      isLoading: false,
    });

    mockTrpc.villageCodesRouter.create.useMutation.mockImplementation(
      ({ onSuccess }) => {
        return {
          mutate: vi.fn(() => {
            onSuccess?.();
          }),
          isLoading: false,
        };
      },
    );

    render(
      <>
        <VillageCodesPage />
        <Toaster toastOptions={{ duration: 100 }} />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "New Village Code" }));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(FORM_PLACEHOLDERS.CODE),
      ).toBeInTheDocument();
    });

    await user.type(
      screen.getByPlaceholderText(FORM_PLACEHOLDERS.CODE),
      MOCK_VILLAGE_CODES.SC.code,
    );
    await user.type(
      screen.getByPlaceholderText(FORM_PLACEHOLDERS.NAME),
      MOCK_VILLAGE_CODES.SC.name,
    );

    await user.click(screen.getByRole("button", { name: "Save" }));

    const toastEl = screen.getByRole("status");

    expect(toastEl).toBeInTheDocument();
    expect(toastEl.textContent).toBe("Village code created!");
  });

  it("toggles show hidden checkbox", async () => {
    const user = userEvent.setup();
    const mockQuery = vi.fn();
    mockTrpc.villageCodesRouter.list.useQuery.mockImplementation(mockQuery);
    mockQuery.mockReturnValue({
      data: mockVillageCodes,
      isLoading: false,
    });

    render(<VillageCodesPage />);

    const showHiddenCheckbox = screen.getByLabelText("Show Hidden");

    expect(mockQuery).toHaveBeenCalledWith({ includeHidden: false });

    await user.click(showHiddenCheckbox);

    expect(mockQuery).toHaveBeenCalledWith({ includeHidden: true });
  });

  it("calls delete mutation when delete button is clicked and confirmed", async () => {
    const user = userEvent.setup();
    const mockDelete = vi.fn();

    mockTrpc.villageCodesRouter.delete.useMutation.mockReturnValue({
      mutate: mockDelete,
    });
    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: mockVillageCodes,
      isLoading: false,
    });

    render(<VillageCodesPage />);

    await user.click(screen.getAllByText("Delete")[0]);

    const confirmButton = await screen.findByRole("button", {
      name: "Confirm",
    });

    await user.click(confirmButton);

    expect(mockDelete).toHaveBeenCalledWith({ id: MOCK_VILLAGE_CODES.PC.id });
  });

  it("shows a success toast when a village code has been successfully deleted", async () => {
    const user = userEvent.setup();
    const mockQuery = vi.fn();
    mockTrpc.villageCodesRouter.list.useQuery.mockImplementation(mockQuery);
    mockQuery.mockReturnValue({
      data: mockVillageCodes,
      isLoading: false,
    });

    mockTrpc.villageCodesRouter.delete.useMutation.mockImplementation(
      ({ onSuccess }) => {
        return {
          mutate: vi.fn(() => {
            onSuccess?.();
          }),
          isLoading: false,
        };
      },
    );

    render(
      <>
        <VillageCodesPage />
        <Toaster />
      </>,
    );

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });

    await user.click(deleteButtons[0]);

    const confirmButton = await screen.findByRole("button", {
      name: "Confirm",
    });

    await user.click(confirmButton);

    const toastEl = screen.getByRole("status");
    expect(toastEl).toBeInTheDocument();
    expect(toastEl).toHaveTextContent("Village code deleted!");
  });

  it("does not delete when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const mockDelete = vi.fn();

    mockTrpc.villageCodesRouter.delete.useMutation.mockReturnValue({
      mutate: mockDelete,
    });
    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: mockVillageCodes,
      isLoading: false,
    });

    render(<VillageCodesPage />);

    await user.click(screen.getAllByRole("button", { name: "Delete" })[0]);

    const cancelButton = await screen.findByRole("button", { name: "Cancel" });

    await user.click(cancelButton);

    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("shows an error message if deletion failed", async () => {
    const user = userEvent.setup();
    const mockQuery = vi.fn();
    mockTrpc.villageCodesRouter.list.useQuery.mockImplementation(mockQuery);
    mockQuery.mockReturnValue({
      data: mockVillageCodes,
      isLoading: false,
    });

    mockTrpc.villageCodesRouter.delete.useMutation.mockImplementation(
      ({ onError }) => {
        return {
          mutate: vi.fn(() => {
            onError?.();
          }),
          isLoading: false,
        };
      },
    );

    render(
      <>
        <VillageCodesPage />
        <Toaster />
      </>,
    );

    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });

    await user.click(deleteButtons[0]);

    const confirmButton = await screen.findByRole("button", {
      name: "Confirm",
    });

    await user.click(confirmButton);

    const toastEl = screen.getByRole("status");
    expect(toastEl).toBeInTheDocument();
    expect(toastEl).toHaveTextContent(
      "Unable to delete village code. Check that there are no visits with this village code before deleting.",
    );
  });

  it("shows only visible village codes by default (hidden checkbox unchecked)", () => {
    render(<VillageCodesPage />);

    // Should show visible village codes (PC and CA)
    expect(screen.getByText(MOCK_VILLAGE_CODES.PC.code)).toBeInTheDocument();
    expect(screen.getByText(MOCK_VILLAGE_CODES.PC.name)).toBeInTheDocument();
    expect(screen.getByText(MOCK_VILLAGE_CODES.CA.code)).toBeInTheDocument();
    expect(screen.getByText(MOCK_VILLAGE_CODES.CA.name)).toBeInTheDocument();

    // Should NOT show hidden village code (TK)
    expect(
      screen.queryByText(MOCK_VILLAGE_CODES.TK.code),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(MOCK_VILLAGE_CODES.TK.name),
    ).not.toBeInTheDocument();
  });

  // IncludeHidden = true
  it("shows all village codes when hidden checkbox is checked", async () => {
    const user = userEvent.setup();

    render(<VillageCodesPage />);

    const showHiddenCheckbox = screen.getByLabelText("Show Hidden");
    await user.click(showHiddenCheckbox);

    await waitFor(() => {
      // Should show all village codes including hidden ones
      expect(screen.getByText(MOCK_VILLAGE_CODES.PC.code)).toBeInTheDocument();
      expect(screen.getByText(MOCK_VILLAGE_CODES.PC.name)).toBeInTheDocument();
      expect(screen.getByText(MOCK_VILLAGE_CODES.CA.code)).toBeInTheDocument();
      expect(screen.getByText(MOCK_VILLAGE_CODES.CA.name)).toBeInTheDocument();
      expect(screen.getByText(MOCK_VILLAGE_CODES.TK.code)).toBeInTheDocument();
      expect(screen.getByText(MOCK_VILLAGE_CODES.TK.name)).toBeInTheDocument();
    });
  });

  // IncludeHidden = false
  it("hides village codes again when hidden checkbox is unchecked", async () => {
    const user = userEvent.setup();

    render(<VillageCodesPage />);

    const showHiddenCheckbox = screen.getByLabelText("Show Hidden");

    await user.click(showHiddenCheckbox);
    await waitFor(() => {
      expect(screen.getByText(MOCK_VILLAGE_CODES.TK.code)).toBeInTheDocument();
    });

    await user.click(showHiddenCheckbox);
    await waitFor(() => {
      expect(
        screen.queryByText(MOCK_VILLAGE_CODES.TK.code),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText(MOCK_VILLAGE_CODES.TK.name),
      ).not.toBeInTheDocument();
    });

    // Visible ones should still be there
    expect(screen.getByText(MOCK_VILLAGE_CODES.PC.code)).toBeInTheDocument();
    expect(screen.getByText(MOCK_VILLAGE_CODES.CA.code)).toBeInTheDocument();
  });
});
