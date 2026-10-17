import SplittingModal from "@/components/medication-stock/SplittingModal";
import { trpc } from "@/utils/trpc";
import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toaster, toast } from "react-hot-toast";
import { assertTableContents } from "@/__tests__/utils/helper-functions";

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
      createSplits: {
        useMutation: vi.fn(),
      },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTrpc = trpc as any;

const MOCK_STOCK = {
  id: 1,
  medicationBrandId: 1,
  quantity: 200,
  expiry: new Date("2026-05-21"),
  location: "Shelf 1",
  stockStatus: "active",
  remarks: "test remark",
  medicationBrandName: "Panadol",
  medicationActiveIngredientName: "Paracetamol",
};

let createSplitsMutate: ReturnType<typeof vi.fn>;
let onClose: () => void;

function renderModal(
  stock:
    | typeof MOCK_STOCK
    | (Omit<typeof MOCK_STOCK, "remarks"> & {
        remarks: string | null;
      }) = MOCK_STOCK,
) {
  return render(
    <>
      <Toaster />
      <SplittingModal stock={stock as never} onClose={onClose} />
    </>,
  );
}

describe("SplittingModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toast.remove();

    onClose = vi.fn();
    createSplitsMutate = vi.fn();

    mockTrpc.medicationStockRouter.createSplits.useMutation.mockReturnValue({
      mutate: createSplitsMutate,
      isPending: false,
    });
  });

  // --- Parent stock details ---

  it("renders all parent stock details", async () => {
    // Given a stock with location, active ingredient, brand name, quantity, status, and remarks
    renderModal();

    // When the modal opens
    const dialog = await screen.findByRole("dialog");
    const parentTable = within(dialog).getByRole("table");

    // Then all parent stock fields are visible in the table
    assertTableContents(parentTable, [
      ["Location:", MOCK_STOCK.location],
      ["Active Ingredient", MOCK_STOCK.medicationActiveIngredientName],
      ["Brand Name", MOCK_STOCK.medicationBrandName],
      ["Quantity:", String(MOCK_STOCK.quantity)],
      ["Status:", MOCK_STOCK.stockStatus],
      ["Remarks:", MOCK_STOCK.remarks],
    ]);
  });

  it("renders an empty remarks cell when remarks is null", async () => {
    // Given a stock with no remarks
    renderModal({ ...MOCK_STOCK, remarks: null });

    // When the modal opens
    const dialog = await screen.findByRole("dialog");
    const parentTable = within(dialog).getByRole("table");

    // Then the remarks cell is empty
    assertTableContents(parentTable, [
      ["Location:", MOCK_STOCK.location],
      ["Active Ingredient", MOCK_STOCK.medicationActiveIngredientName],
      ["Brand Name", MOCK_STOCK.medicationBrandName],
      ["Quantity:", String(MOCK_STOCK.quantity)],
      ["Status:", MOCK_STOCK.stockStatus],
      ["Remarks:", ""],
    ]);
  });

  // --- Empty state ---

  it("shows the empty state when no splits exist", async () => {
    // Given the modal has just opened with no splits added
    renderModal();

    // When no splits have been added (no action)
    await screen.findByRole("dialog");

    // Then the empty state message is visible
    expect(
      screen.getByText("No splits added, add a split to begin."),
    ).toBeInTheDocument();
  });

  it("does not show the empty state once a split is added", async () => {
    // Given the modal is open and the empty state is visible
    const user = userEvent.setup();
    renderModal();
    await screen.findByRole("dialog");
    expect(
      screen.getByText("No splits added, add a split to begin."),
    ).toBeInTheDocument();

    // When the user clicks "Add Split"
    await user.click(screen.getByRole("button", { name: "Add Split" }));

    // Then the empty state message disappears
    await waitFor(() => {
      expect(
        screen.queryByText("No splits added, add a split to begin."),
      ).not.toBeInTheDocument();
    });
  });

  // --- Child table rows ---

  it("renders a child row with editable fields pre-filled from parent values", async () => {
    // Given the modal is open with no splits
    const user = userEvent.setup();
    renderModal();

    // When the user clicks "Add Split"
    await user.click(await screen.findByRole("button", { name: "Add Split" }));

    // Then a child row appears with index 1 and all fields defaulting to the parent stock values
    await waitFor(() => {
      const dialog = screen.getByRole("dialog");
      const childTable = within(dialog).getAllByRole("table")[1];

      expect(
        within(childTable).getByRole("cell", { name: "1" }),
      ).toBeInTheDocument();
      expect(
        within(childTable).getByDisplayValue(MOCK_STOCK.location),
      ).toBeInTheDocument();
      expect(
        within(childTable).getByDisplayValue(MOCK_STOCK.stockStatus),
      ).toBeInTheDocument();
      expect(
        within(childTable).getByDisplayValue(String(MOCK_STOCK.quantity)),
      ).toBeInTheDocument();
      expect(
        within(childTable).getByDisplayValue(MOCK_STOCK.remarks),
      ).toBeInTheDocument();
    });
  });

  // --- Remove child row ---

  it("removes the correct row when '-' is clicked", async () => {
    // Given two splits with distinct locations so they can be told apart
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByRole("button", { name: "Add Split" }));
    await user.click(screen.getByRole("button", { name: "Add Split" }));

    const dialog = screen.getByRole("dialog");
    const childTable = within(dialog).getAllByRole("table")[1];

    const locationInputs = within(childTable).getAllByDisplayValue(
      MOCK_STOCK.location,
    );
    await user.clear(locationInputs[0]);
    await user.type(locationInputs[0], "Location A");
    await user.clear(locationInputs[1]);
    await user.type(locationInputs[1], "Location B");

    // When the '-' button of the first row is clicked
    const removeButtons = within(childTable).getAllByRole("button", {
      name: "-",
    });
    await user.click(removeButtons[0]);

    // Then "Location A" is gone, "Location B" remains and re-indexes to row 1
    await waitFor(() => {
      expect(screen.queryByDisplayValue("Location A")).not.toBeInTheDocument();
      expect(screen.getByDisplayValue("Location B")).toBeInTheDocument();
      expect(
        within(childTable).getByRole("cell", { name: "1" }),
      ).toBeInTheDocument();
      expect(
        within(childTable).queryByRole("cell", { name: "2" }),
      ).not.toBeInTheDocument();
    });
  });

  // --- handleSubmit: validation failures ---

  it("blocks submission and shows an error when there are no splits", async () => {
    // Given the modal is open with no splits added
    const user = userEvent.setup();
    renderModal();
    await screen.findByRole("dialog");

    // When the user clicks Confirm
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    // Then an error toast is shown and the mutation is not called
    expect(createSplitsMutate).not.toHaveBeenCalled();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Submitting without a split does nothing!",
    );
  });

  it("blocks submission and prompts using editing function instead when there is only 1 split", async () => {
    // Given exactly one split has been added
    const user = userEvent.setup();
    renderModal();
    await user.click(await screen.findByRole("button", { name: "Add Split" }));

    // When the user clicks Confirm
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    // Then an error toast is shown and the mutation is not called
    expect(createSplitsMutate).not.toHaveBeenCalled();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Please use the editing function instead to edit a single split!",
    );
  });

  it("blocks submission and shows an error when split quantities do not sum to parent quantity", async () => {
    // Given two splits whose quantities both default to the parent quantity (total exceeds parent)
    const user = userEvent.setup();
    renderModal();

    await user.click(await screen.findByRole("button", { name: "Add Split" }));
    await user.click(screen.getByRole("button", { name: "Add Split" }));

    const dialog = screen.getByRole("dialog");
    const childTable = within(dialog).getAllByRole("table")[1];
    const locationInputs = within(childTable).getAllByDisplayValue(
      MOCK_STOCK.location,
    );
    await user.clear(locationInputs[1]);
    await user.type(locationInputs[1], "Location B");

    // When the user clicks Confirm
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    // Then an error toast is shown and the mutation is not called
    expect(createSplitsMutate).not.toHaveBeenCalled();
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Child stock quantity does not equal parent stock quantity!",
    );
  });

  // --- handleSubmit: happy path ---

  it("calls the mutation with the correct payload and closes the modal on success", async () => {
    // Given two valid distinct splits whose quantities sum to the parent quantity
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.createSplits.useMutation.mockImplementation(
      ({ onSuccess }: { onSuccess: () => void }) => {
        createSplitsMutate.mockImplementation(() => onSuccess?.());
        return { mutate: createSplitsMutate, isPending: false };
      },
    );

    renderModal();

    await user.click(await screen.findByRole("button", { name: "Add Split" }));
    await user.click(screen.getByRole("button", { name: "Add Split" }));

    const dialog = screen.getByRole("dialog");
    const childTable = within(dialog).getAllByRole("table")[1];

    const locationInputs = within(childTable).getAllByDisplayValue(
      MOCK_STOCK.location,
    );
    const quantityInputs = within(childTable).getAllByDisplayValue(
      String(MOCK_STOCK.quantity),
    );

    const half = Math.floor(MOCK_STOCK.quantity / 2);
    const rest = MOCK_STOCK.quantity - half;

    await user.clear(locationInputs[0]);
    await user.type(locationInputs[0], "Location A");
    await user.clear(quantityInputs[0]);
    await user.type(quantityInputs[0], String(half));

    await user.clear(locationInputs[1]);
    await user.type(locationInputs[1], "Location B");
    await user.clear(quantityInputs[1]);
    await user.type(quantityInputs[1], String(rest));

    // When the user clicks Confirm
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    // Then the mutation is called with the correct payload and the modal is closed
    expect(createSplitsMutate).toHaveBeenCalledWith({
      parentId: MOCK_STOCK.id,
      splits: [
        {
          location: "Location A",
          stockStatus: MOCK_STOCK.stockStatus,
          quantity: half,
          remarks: MOCK_STOCK.remarks ?? undefined,
        },
        {
          location: "Location B",
          stockStatus: MOCK_STOCK.stockStatus,
          quantity: rest,
          remarks: MOCK_STOCK.remarks ?? undefined,
        },
      ],
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("shows a success toast when the mutation succeeds", async () => {
    // Given two valid distinct splits
    const user = userEvent.setup();

    mockTrpc.medicationStockRouter.createSplits.useMutation.mockImplementation(
      ({ onSuccess }: { onSuccess: () => void }) => {
        createSplitsMutate.mockImplementation(() => onSuccess?.());
        return { mutate: createSplitsMutate, isPending: false };
      },
    );

    renderModal();

    await user.click(await screen.findByRole("button", { name: "Add Split" }));
    await user.click(screen.getByRole("button", { name: "Add Split" }));

    const dialog = screen.getByRole("dialog");
    const childTable = within(dialog).getAllByRole("table")[1];

    const locationInputs = within(childTable).getAllByDisplayValue(
      MOCK_STOCK.location,
    );
    const quantityInputs = within(childTable).getAllByDisplayValue(
      String(MOCK_STOCK.quantity),
    );

    const half = Math.floor(MOCK_STOCK.quantity / 2);
    const rest = MOCK_STOCK.quantity - half;

    await user.clear(locationInputs[0]);
    await user.type(locationInputs[0], "Location A");
    await user.clear(quantityInputs[0]);
    await user.type(quantityInputs[0], String(half));

    await user.clear(locationInputs[1]);
    await user.type(locationInputs[1], "Location B");
    await user.clear(quantityInputs[1]);
    await user.type(quantityInputs[1], String(rest));

    // When the user clicks Confirm and the mutation succeeds
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    // Then a success toast is displayed
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Successfully split!",
    );
  });

  it("shows an error toast and keeps the modal open when the mutation fails", async () => {
    // Given two valid distinct splits and a mutation configured to fail
    const user = userEvent.setup();
    const mockError = new Error("Split failed");

    mockTrpc.medicationStockRouter.createSplits.useMutation.mockImplementation(
      ({ onError }: { onError: (err: Error) => void }) => {
        createSplitsMutate.mockImplementation(() => onError?.(mockError));
        return { mutate: createSplitsMutate, isPending: false };
      },
    );

    renderModal();

    await user.click(await screen.findByRole("button", { name: "Add Split" }));
    await user.click(screen.getByRole("button", { name: "Add Split" }));

    const dialog = screen.getByRole("dialog");
    const childTable = within(dialog).getAllByRole("table")[1];

    const locationInputs = within(childTable).getAllByDisplayValue(
      MOCK_STOCK.location,
    );
    const quantityInputs = within(childTable).getAllByDisplayValue(
      String(MOCK_STOCK.quantity),
    );

    const half = Math.floor(MOCK_STOCK.quantity / 2);
    const rest = MOCK_STOCK.quantity - half;

    await user.clear(locationInputs[0]);
    await user.type(locationInputs[0], "Location A");
    await user.clear(quantityInputs[0]);
    await user.type(quantityInputs[0], String(half));

    await user.clear(locationInputs[1]);
    await user.type(locationInputs[1], "Location B");
    await user.clear(quantityInputs[1]);
    await user.type(quantityInputs[1], String(rest));

    // When the user clicks Confirm and the mutation fails
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    // Then an error toast is shown and the modal remains open
    expect(await screen.findByRole("status")).toHaveTextContent(
      mockError.message,
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});
