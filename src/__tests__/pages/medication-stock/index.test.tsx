import { Toaster, toast } from "react-hot-toast";
import userEvent from "@testing-library/user-event";
import { trpc } from "@/utils/trpc";
import {
  cleanup,
  render,
  screen,
  within,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import MedicationStockBasePage from "@/pages/medication-stock";
import {
  assertBreadcrumbs,
  assertLoadingSpinner,
  assertTableContents,
} from "@/__tests__/utils/helper-functions";

const MOCK_STOCK = [
  {
    id: 1,
    medicationBrandId: 1,
    quantity: 200,
    expiry: new Date("2026-05-21 09:30:00+00"),
    location: "Shelf 1",
    stockStatus: "active",
    remarks: "test remark",
    medicationBrandName: "Panadol",
    medicationActiveIngredientName: "Paracetamol",
  },
];

// Mock tRPC
vi.mock("@/utils/trpc", () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      medicationStockRouter: {
        listWithBrandAndActiveIngredient: {
          invalidate: vi.fn(),
        },
      },
    })),
    medicationStockRouter: {
      listWithBrandAndActiveIngredient: {
        useQuery: vi.fn(),
      },
      create: {
        useMutation: vi.fn(),
      },
      update: {
        useMutation: vi.fn(),
      },
      createSplits: {
        useMutation: vi.fn(),
      },
    },
    medicationBrandRouter: {
      listWithActiveIngredientName: {
        useQuery: vi.fn(),
      },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTrpc = trpc as any;

let createMockMutation: ReturnType<typeof vi.fn>;
let updateMockMutation: ReturnType<typeof vi.fn>;
let createSplitsMockMutation: ReturnType<typeof vi.fn>;

describe("MedicationStockPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toast.removeAll();

    createMockMutation = vi.fn();
    updateMockMutation = vi.fn();
    createSplitsMockMutation = vi.fn();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockImplementation(
      () => ({
        data: MOCK_STOCK,
        isLoading: false,
      }),
    );

    mockTrpc.medicationStockRouter.createSplits.useMutation.mockReturnValue({
      mutate: createSplitsMockMutation,
      isPending: false,
    });

    mockTrpc.medicationStockRouter.update.useMutation.mockReturnValue({
      mutate: updateMockMutation,
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders page title and breadcrumbs", () => {
    render(<MedicationStockBasePage />);
    expect(
      screen.getByRole("heading", { name: "Medication Stock" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Manage medication stock.")).toBeInTheDocument();
    assertBreadcrumbs(["Home", "Medication Stock"]);
  });

  it("displays loading state", () => {
    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: undefined,
        isLoading: true,
      },
    );

    render(<MedicationStockBasePage />);

    assertLoadingSpinner("Loading stock...");
  });

  it("displays a message that there is no stock if there is no data", () => {
    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: [],
        isLoading: false,
      },
    );

    render(<MedicationStockBasePage />);

    expect(
      screen.getByText(
        "No stock found. Seed the database or add a new record.",
      ),
    ).toBeInTheDocument();
  });

  it("displays stock in table", async () => {
    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    render(<MedicationStockBasePage />);

    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
    assertTableContents(table, [
      [
        "Active Ingredient",
        "Brand",
        "Location",
        "Quantity",
        "Expiry",
        "State",
        "Remarks",
        "Actions",
      ],
      [
        "Paracetamol",
        "Panadol",
        "Shelf 1",
        "200",
        "5/21/2026",
        "active",
        "test remark",
        "EditSplit",
      ],
    ]);
  });

  it("opens a modal to add new stock when the Add Stock button is clicked", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    mockTrpc.medicationBrandRouter.listWithActiveIngredientName.useQuery.mockReturnValue(
      {
        data: [],
        isLoading: false,
      },
    );

    mockTrpc.medicationStockRouter.create.useMutation.mockReturnValue({
      isPending: false,
    });

    render(
      <>
        <MedicationStockBasePage />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Add Stock" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Add New Stock" }),
    ).toBeInTheDocument();
  });

  it("closes the add new stock modal when the cross button or the cancel button is clicked", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    render(<MedicationStockBasePage />);

    // test cancel button
    await user.click(screen.getByRole("button", { name: "Add Stock" }));
    const dialog = await screen.findByRole("dialog");

    const cancelButton = within(dialog).getByRole("button", {
      name: "Cancel",
    });
    await user.click(cancelButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // test cross button
    await user.click(screen.getByRole("button", { name: "Add Stock" }));
    const dialogSecond = await screen.findByRole("dialog");

    const crossButton = within(dialogSecond).getByRole("button", {
      name: "",
    });
    await user.click(crossButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("only allows positive numeric inputs in quantity field in add new stock modal", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    mockTrpc.medicationBrandRouter.listWithActiveIngredientName.useQuery.mockReturnValue(
      {
        data: [
          {
            id: 1,
            name: "Panadol",
            activeIngredientName: "Paracetamol 500mg",
          },
        ],
        isLoading: false,
      },
    );

    mockTrpc.medicationStockRouter.create.useMutation.mockReturnValue({
      isPending: false,
    });

    render(
      <>
        <MedicationStockBasePage />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Add Stock" }));

    const dialog = await screen.findByRole("dialog");

    const locationInput = dialog.querySelector('input[name="location"]');
    const quantityInput = dialog.querySelector('input[name="quantity"]');
    const expiryInput = dialog.querySelector('input[name="expiry"]');

    expect(locationInput).toBeInTheDocument();
    expect(quantityInput).toBeInTheDocument();
    expect(expiryInput).toBeInTheDocument();

    // dropdown uses buttons
    const brandIdButton = dialog.querySelector(
      'button[name="medicationBrandId-dropdown-button"]',
    );
    const statusButton = dialog.querySelector(
      'button[name="stockStatus-dropdown-button"]',
    );

    expect(brandIdButton).toBeInTheDocument();
    expect(statusButton).toBeInTheDocument();

    await user.type(locationInput!, "valid location");
    fireEvent.change(expiryInput!, { target: { value: "2026-12-31" } });
    await user.click(brandIdButton!);

    const brandDropdownButton = dialog.querySelector(
      'button[name="medicationBrandId-1-dropdown-option"]',
    );
    await user.click(brandDropdownButton!);

    await user.click(statusButton!);
    const stockDropdownOption = dialog.querySelector(
      'button[name="stockStatus-active-dropdown-option"]',
    );
    await user.click(stockDropdownOption!);

    await user.type(quantityInput!, "-1");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Please input only positive values."));

    await user.clear(quantityInput!);
    await user.type(quantityInput!, "0");
    await user.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("Please input only positive values."));
  });

  it("closes the new stock modal, displays a success toast, and refreshes the list when valid new stock is added", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    mockTrpc.medicationBrandRouter.listWithActiveIngredientName.useQuery.mockReturnValue(
      {
        data: [
          {
            id: 1,
            name: "Panadol",
            activeIngredientName: "Paracetamol 500mg",
          },
        ],
        isLoading: false,
      },
    );

    mockTrpc.medicationStockRouter.create.useMutation.mockImplementation(
      ({ onSuccess }: { onSuccess: () => void }) => {
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
        <MedicationStockBasePage />
        <Toaster />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Add Stock" }));

    const dialog = await screen.findByRole("dialog");

    const locationInput = dialog.querySelector('input[name="location"]');
    const quantityInput = dialog.querySelector('input[name="quantity"]');
    const expiryInput = dialog.querySelector('input[name="expiry"]');

    expect(locationInput).toBeInTheDocument();
    expect(quantityInput).toBeInTheDocument();
    expect(expiryInput).toBeInTheDocument();

    // dropdown uses buttons
    const brandIdButton = dialog.querySelector(
      'button[name="medicationBrandId-dropdown-button"]',
    );
    const statusButton = dialog.querySelector(
      'button[name="stockStatus-dropdown-button"]',
    );

    expect(brandIdButton).toBeInTheDocument();
    expect(statusButton).toBeInTheDocument();

    await user.type(locationInput!, "valid location");
    await user.type(quantityInput!, "100");
    fireEvent.change(expiryInput!, { target: { value: "2026-12-31" } });
    await user.click(brandIdButton!);

    const brandDropdownButton = dialog.querySelector(
      'button[name="medicationBrandId-1-dropdown-option"]',
    );
    await user.click(brandDropdownButton!);

    await user.click(statusButton!);
    const stockDropdownOption = dialog.querySelector(
      'button[name="stockStatus-active-dropdown-option"]',
    );
    await user.click(stockDropdownOption!);

    await user.click(screen.getByRole("button", { name: "Save" }));

    // assert toast appears
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Successfully created!",
    );
  });

  // Stock editing

  it("changes to row editing mode when edit button is clicked", async () => {
    // only location, state, remarks editable
    // edit button turns into save button
    const user = userEvent.setup();
    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    const screen = render(<MedicationStockBasePage />);

    expect(document.querySelectorAll("input").length).toBe(0);

    await user.click(screen.getByRole("button", { name: "Edit" }));

    // Location and remarks field (free text)
    expect(document.querySelectorAll("input").length).toBe(2);

    // Dropdown field
    expect(
      document.querySelector('button[name="stockStatus-dropdown-button"]'),
    ).toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("disallows saves if the Save button is clicked when no fields are dirty", async () => {
    const user = userEvent.setup();
    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    const screen = render(
      <>
        <Toaster />
        <MedicationStockBasePage />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));

    await user.click(screen.getByRole("button", { name: "Save" }));

    const toastEl = screen.getByRole("status");
    expect(toastEl).toBeInTheDocument();
    expect(toastEl).toHaveTextContent("No fields changed!");
  });

  it("saves when location field has been dirtied and saved", async () => {
    const user = userEvent.setup();
    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    mockTrpc.medicationStockRouter.update.useMutation.mockImplementation(
      ({ onSuccess }: { onSuccess: () => void }) => {
        return {
          mutate: vi.fn(() => {
            onSuccess?.();
          }),
          isLoading: false,
        };
      },
    );

    const screen = render(
      <>
        <Toaster />
        <MedicationStockBasePage />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));

    const locationInput = document.querySelector('input[name="location"]');

    await user.type(locationInput!, "valid location");

    await user.click(screen.getByRole("button", { name: "Save" }));

    const toastEl = screen.getByRole("status");
    expect(toastEl).toBeInTheDocument();
    expect(toastEl).toHaveTextContent("Successfully updated!");
  });

  it("saves when remarks field has been dirtied and saved", async () => {
    const user = userEvent.setup();
    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    mockTrpc.medicationStockRouter.update.useMutation.mockImplementation(
      ({ onSuccess }: { onSuccess: () => void }) => {
        return {
          mutate: vi.fn(() => {
            onSuccess?.();
          }),
          isLoading: false,
        };
      },
    );

    const screen = render(
      <>
        <Toaster />
        <MedicationStockBasePage />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));

    const remarksInput = document.querySelector('input[name="remarks"]');

    await user.type(remarksInput!, "valid remarks");

    await user.click(screen.getByRole("button", { name: "Save" }));

    const toastEl = screen.getByRole("status");
    expect(toastEl).toBeInTheDocument();
    expect(toastEl).toHaveTextContent("Successfully updated!");
  });

  it("saves when stock status dropdown has been dirtied and saved", async () => {
    const user = userEvent.setup();
    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    mockTrpc.medicationStockRouter.update.useMutation.mockImplementation(
      ({ onSuccess }: { onSuccess: () => void }) => {
        return {
          mutate: vi.fn(() => {
            onSuccess?.();
          }),
          isLoading: false,
        };
      },
    );

    const screen = render(
      <>
        <Toaster />
        <MedicationStockBasePage />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));

    const dropdownButton = document.querySelector(
      'button[name="stockStatus-dropdown-button"]',
    );

    await user.click(dropdownButton!);

    const dropdownButtonDonated = document.querySelector(
      'button[name="stockStatus-donated-dropdown-option"]',
    );
    await user.click(dropdownButtonDonated!);

    await user.click(screen.getByRole("button", { name: "Save" }));

    const toastEl = screen.getByRole("status");
    expect(toastEl).toBeInTheDocument();
    expect(toastEl).toHaveTextContent("Successfully updated!");
  });

  it("shows an error toast if an error occurs during update", async () => {
    const user = userEvent.setup();
    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    const mockError = new Error("Mock test error");

    mockTrpc.medicationStockRouter.update.useMutation.mockImplementation(
      ({ onError }: { onError: (err: Error) => void }) => {
        return {
          mutate: vi.fn(() => {
            onError?.(mockError);
          }),
          isLoading: false,
        };
      },
    );

    const screen = render(
      <>
        <Toaster />
        <MedicationStockBasePage />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));

    const remarksInput = document.querySelector('input[name="remarks"]');

    await user.type(remarksInput!, "valid remarks");

    await user.click(screen.getByRole("button", { name: "Save" }));

    const toastEl = screen.getByRole("status");
    expect(toastEl).toBeInTheDocument();
    expect(toastEl).toHaveTextContent(
      "An error has occurred while updating the stock. Refresh and try again.",
    );
  });

  it("does not include locked fields in mutation payload", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    render(<MedicationStockBasePage />);

    await user.click(screen.getByRole("button", { name: "Edit" }));

    const locationInput = document.querySelector('input[name="location"]');
    await user.type(locationInput!, " New Shelf");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(updateMockMutation).toHaveBeenCalledTimes(1);

    const payload = updateMockMutation.mock.calls[0][0];

    expect(payload).toHaveProperty("id", MOCK_STOCK[0].id);
    expect(payload).toHaveProperty("location", "Shelf 1 New Shelf");

    expect(payload).not.toHaveProperty("quantity");
    expect(payload).not.toHaveProperty("expiry");
    expect(payload).not.toHaveProperty("medicationBrandId");
    expect(payload).not.toHaveProperty("medicationBrandName");
    expect(payload).not.toHaveProperty("medicationActiveIngredientName");
  });

  it("discards edits and resets the dirty state when Cancel is clicked", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    render(<MedicationStockBasePage />);

    await user.click(screen.getByRole("button", { name: "Edit" }));

    const locationInput = document.querySelector(
      'input[name="location"]',
    ) as HTMLInputElement;

    await user.clear(locationInput);
    await user.type(locationInput, "Temporary Shelf");
    expect(locationInput.value).toBe("Temporary Shelf");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(
      document.querySelector('input[name="location"]'),
    ).not.toBeInTheDocument();
    expect(screen.getByText(MOCK_STOCK[0].location)).toBeInTheDocument();
    expect(createMockMutation).not.toHaveBeenCalled();
  });

  // Stock splitting

  it("opens a 'Split Stock' modal with the parent stock details, 'Add Split' button, and 'Confirm' button when the split button is clicked", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    render(
      <>
        <MedicationStockBasePage />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Split" }));

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      expect(screen.getByText("Split Stock")).toBeInTheDocument();
      expect(screen.getByText("Parent stock details")).toBeInTheDocument();
      const parentStockTable = within(dialog).getByRole("table");

      // expect parent stock details to be in table format
      assertTableContents(parentStockTable, [
        ["Location:", MOCK_STOCK[0].location],
        ["Active Ingredient", MOCK_STOCK[0].medicationActiveIngredientName],
        ["Brand Name", MOCK_STOCK[0].medicationBrandName],
        ["Quantity", String(MOCK_STOCK[0].quantity)],
        ["Status:", MOCK_STOCK[0].stockStatus],
        ["Remarks", MOCK_STOCK[0].remarks],
      ]);
      // expect buttons to be there
      expect(
        screen.getByRole("button", { name: "Add Split" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Confirm" }),
      ).toBeInTheDocument();
    });
  });

  it("shows 'No splits added, add a split to begin' only when there are 0 child stocks added", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    render(
      <>
        <MedicationStockBasePage />
      </>,
    );

    await user.click(await screen.findByRole("button", { name: "Split" }));

    expect(
      screen.getByText("No splits added, add a split to begin."),
    ).toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: "Add Split" }));

    await waitFor(() => {
      expect(
        screen.queryByText("No splits added, add a split to begin."),
      ).not.toBeInTheDocument();
    });
  });

  it("creates a new child stock component with corresponding split indexes, with editable components for all editable fields, default values copying the parent stock, when the 'Add Split' button is clicked", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    render(<MedicationStockBasePage />);

    await user.click(await screen.findByRole("button", { name: "Split" }));
    await user.click(await screen.findByRole("button", { name: "Add Split" }));

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      const childSplitsTable = within(dialog).getAllByRole("table")[1];

      // index starts at 1
      expect(
        within(childSplitsTable).getByRole("cell", { name: "1" }),
      ).toBeInTheDocument();

      // editablecell populated with default parent values
      const locationInput = within(childSplitsTable).getByDisplayValue(
        MOCK_STOCK[0].location,
      );
      const statusSelect = within(childSplitsTable).getByDisplayValue(
        MOCK_STOCK[0].stockStatus,
      );
      const quantityInput = within(childSplitsTable).getByDisplayValue(
        String(MOCK_STOCK[0].quantity),
      );
      const remarksInput = within(childSplitsTable).getByDisplayValue(
        MOCK_STOCK[0].remarks,
      );

      expect(locationInput).toBeInTheDocument();
      expect(statusSelect).toBeInTheDocument();
      expect(quantityInput).toBeInTheDocument();
      expect(remarksInput).toBeInTheDocument();
    });
  });

  it("removes the split when the '-' button is clicked", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    render(<MedicationStockBasePage />);

    await user.click(await screen.findByRole("button", { name: "Split" }));

    await user.click(await screen.findByRole("button", { name: "Add Split" }));
    await user.click(await screen.findByRole("button", { name: "Add Split" }));

    const dialog = screen.getByRole("dialog");
    const removeButtons = within(dialog).getAllByRole("button", { name: "-" });
    expect(removeButtons).toHaveLength(2);

    await user.click(removeButtons[0]);

    await waitFor(() => {
      const updatedRemoveButtons = within(dialog).getAllByRole("button", {
        name: "-",
      });
      expect(updatedRemoveButtons).toHaveLength(1);
    });
  });

  it("rejects when confirming the split if there are less than 2 child stock", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    render(<MedicationStockBasePage />);

    await user.click(await screen.findByRole("button", { name: "Split" }));
    await user.click(await screen.findByRole("button", { name: "Add Split" }));

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    // caught by validation, mutation not called
    expect(createSplitsMockMutation).not.toHaveBeenCalled();
  });

  it("rejects when the total quantity of child splits do not equal the quantity in the parent split", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    render(<MedicationStockBasePage />);

    await user.click(await screen.findByRole("button", { name: "Split" }));

    await user.click(await screen.findByRole("button", { name: "Add Split" }));
    await user.click(await screen.findByRole("button", { name: "Add Split" }));

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(createMockMutation).not.toHaveBeenCalled();
  });

  it("rejects when splits are not distinct from each other", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    render(<MedicationStockBasePage />);

    await user.click(await screen.findByRole("button", { name: "Split" }));

    await user.click(await screen.findByRole("button", { name: "Add Split" }));
    await user.click(await screen.findByRole("button", { name: "Add Split" }));

    const dialog = screen.getByRole("dialog");
    const childSplitsTable = within(dialog).getAllByRole("table")[1];
    const quantityInputs = within(childSplitsTable).getAllByDisplayValue(
      String(MOCK_STOCK[0].quantity),
    );

    const halfQuantity = Math.floor(MOCK_STOCK[0].quantity / 2);
    await user.clear(quantityInputs[0]);
    await user.type(quantityInputs[0], String(halfQuantity));
    await user.clear(quantityInputs[1]);
    await user.type(
      quantityInputs[1],
      String(MOCK_STOCK[0].quantity - halfQuantity),
    );

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(createMockMutation).not.toHaveBeenCalled();
  });

  it("creates new child stock entries in the table when the split succeeds", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    render(<MedicationStockBasePage />);

    await user.click(await screen.findByRole("button", { name: "Split" }));

    await user.click(await screen.findByRole("button", { name: "Add Split" }));
    await user.click(await screen.findByRole("button", { name: "Add Split" }));

    const dialog = screen.getByRole("dialog");
    const childSplitsTable = within(dialog).getAllByRole("table")[1];

    // distinct inputs, total quantity matches parent quantity
    const locationInputs = within(childSplitsTable).getAllByDisplayValue(
      MOCK_STOCK[0].location,
    );
    const quantityInputs = within(childSplitsTable).getAllByDisplayValue(
      String(MOCK_STOCK[0].quantity),
    );

    const halfQty = Math.floor(MOCK_STOCK[0].quantity / 2);
    const remainingQty = MOCK_STOCK[0].quantity - halfQty;

    // split 1 updates
    await user.clear(locationInputs[0]);
    await user.type(locationInputs[0], "Location A");
    await user.clear(quantityInputs[0]);
    await user.type(quantityInputs[0], String(halfQty));

    // split 2 updates
    await user.clear(locationInputs[1]);
    await user.type(locationInputs[1], "Location B");
    await user.clear(quantityInputs[1]);
    await user.type(quantityInputs[1], String(remainingQty));

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(createSplitsMockMutation).toHaveBeenCalledWith({
      parentId: MOCK_STOCK[0].id,
      splits: [
        {
          location: "Location A",
          stockStatus: MOCK_STOCK[0].stockStatus,
          quantity: halfQty,
          remarks: MOCK_STOCK[0].remarks ?? undefined,
        },
        {
          location: "Location B",
          stockStatus: MOCK_STOCK[0].stockStatus,
          quantity: remainingQty,
          remarks: MOCK_STOCK[0].remarks ?? undefined,
        },
      ],
    });
  });
});
