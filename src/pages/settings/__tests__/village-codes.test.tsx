import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import VillageCodesPage from "@/pages/settings/village-codes";
import { trpc } from "@/utils/trpc";

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
    isVisible: false,
  },
  TK: {
    code: "TK",
    name: "TK Village",
    colorHex: "#2ECC71",
    isVisible: true,
  },
  SC: {
    code: "SC",
    name: "SC Village",
  },
} as const;

const FORM_PLACEHOLDERS = {
  CODE: "e.g. V001",
  NAME: "Village Name",
} as const;

const UI_MESSAGES = {
  DELETE_CONFIRM: "Are you sure you want to delete this code?",
} as const;

const mockVillageCodes = [
  MOCK_VILLAGE_CODES.PC,
  MOCK_VILLAGE_CODES.CA,
  MOCK_VILLAGE_CODES.TK,
];

describe("VillageCodesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

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
  });

  it("renders page title and breadcrumbs", () => {
    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: mockVillageCodes,
      isLoading: false,
    });

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
    expect(screen.getByText("Loading...")).toBeInTheDocument();
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

    expect(
      screen.getByRole("heading", { name: "New Village Code" }),
    ).toBeInTheDocument();
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

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);

    expect(
      screen.getByRole("heading", { name: "Edit Village Code" }),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(MOCK_VILLAGE_CODES.PC.name),
    ).toBeInTheDocument();
  });

  it("closes form when cancel button is clicked", async () => {
    const user = userEvent.setup();
    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: mockVillageCodes,
      isLoading: false,
    });

    render(<VillageCodesPage />);

    await user.click(screen.getByRole("button", { name: "New Village Code" }));
    expect(
      screen.getByRole("heading", { name: "New Village Code" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByRole("heading", { name: "New Village Code" }),
    ).not.toBeInTheDocument();
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

    await user.click(screen.getByText("New Village Code"));

    await user.type(
      screen.getByPlaceholderText(FORM_PLACEHOLDERS.CODE),
      MOCK_VILLAGE_CODES.SC.code,
    );
    await user.type(
      screen.getByPlaceholderText(FORM_PLACEHOLDERS.NAME),
      MOCK_VILLAGE_CODES.SC.name,
    );

    await user.click(screen.getByText("Save"));

    expect(mockCreate).toHaveBeenCalledWith({
      code: MOCK_VILLAGE_CODES.SC.code,
      name: MOCK_VILLAGE_CODES.SC.name,
      colorHex: "#3b82f6", // This is the default color that the form uses
      isVisible: true,
    });
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

    // Mock window.confirm
    window.confirm = vi.fn(() => true);

    mockTrpc.villageCodesRouter.delete.useMutation.mockReturnValue({
      mutate: mockDelete,
    });
    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: mockVillageCodes,
      isLoading: false,
    });

    render(<VillageCodesPage />);

    await user.click(screen.getAllByText("Delete")[0]);

    expect(window.confirm).toHaveBeenCalledWith(UI_MESSAGES.DELETE_CONFIRM);
    expect(mockDelete).toHaveBeenCalledWith({ id: MOCK_VILLAGE_CODES.PC.id });
  });

  it("does not delete when confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const mockDelete = vi.fn();

    // Mock window.confirm to return false
    window.confirm = vi.fn(() => false);

    mockTrpc.villageCodesRouter.delete.useMutation.mockReturnValue({
      mutate: mockDelete,
    });
    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: mockVillageCodes,
      isLoading: false,
    });

    render(<VillageCodesPage />);

    await user.click(screen.getAllByText("Delete")[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });
});
