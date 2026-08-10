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

describe("MedicationStockPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toast.removeAll();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockImplementation(
      () => ({
        data: MOCK_STOCK,
        isLoading: false,
      }),
    );
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

  // Stock splitting

  it("opens a 'Split Stock' modal with the parent stock details, 'Add Split' button, and 'Confirm' button when the split button is clicked", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: MOCK_STOCK,
        isLoading: false,
      },
    );

    mockTrpc.medicationStockRouter.createSplits.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

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

    mockTrpc.medicationStockRouter.createSplits.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

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

    mockTrpc.medicationStockRouter.createSplits.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    render(
      <>
        <MedicationStockBasePage />
      </>,
    );

    await user.click(await screen.findByRole("button", { name: "Split" }));

    await user.click(await screen.findByRole("button", { name: "Add Split" }));

    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      const childSplitsTable = within(dialog).getAllByRole("table")[1];
    });
  });

  it("removes the split when the '-' button is clicked", () => {});

  it("rejects when confirming the split if there are less than 2 child stock", () => {});

  it("rejects when the total quantity of child splits do not equal the quantity in the parent split", () => {});

  it("rejects when splits are not distinct from each other", () => {});

  it("creates new child stock entries in the table when the split succeeds", () => {});
});
