import { Toaster, toast } from "react-hot-toast";
import userEvent from "@testing-library/user-event";
import { trpc } from "@/utils/trpc";
import {
  cleanup,
  render,
  screen,
  within,
  fireEvent,
} from "@testing-library/react";
import MedicationStockBasePage from "@/pages/medication-stock";
import {
  assertBreadcrumbs,
  assertLoadingSpinner,
  assertTableContents,
} from "@/__tests__/utils/helper-functions";

const mockStock = [
  {
    id: 1,
    medicationBrandId: 1,
    quantity: 200,
    expiry: new Date("2026-05-21 09:30:00+00"),
    location: "Shelf 1",
    stockStatus: "active",
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
        data: mockStock,
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
        data: mockStock,
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
        "Actions",
      ],
      [
        "Paracetamol",
        "Panadol",
        "Shelf 1",
        "200",
        "5/21/2026",
        "active",
        "EditSplit",
      ],
    ]);
  });

  it("opens a modal to add new stock when the Add Stock button is clicked", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.listWithBrandAndActiveIngredient.useQuery.mockReturnValue(
      {
        data: mockStock,
        isLoading: false,
      },
    );

    mockTrpc.medicationBrandRouter.listWithActiveIngredientName.useQuery.mockReturnValue(
      {
        data: [],
        isLoading: false,
      },
    );

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
        data: mockStock,
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
        data: mockStock,
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
      'button[name="stockStatus-1-dropdown-option"]',
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
        data: mockStock,
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
});
