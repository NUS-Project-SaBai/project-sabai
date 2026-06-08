import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MedicationActiveIngredientsBasePage from "@/pages/medication-active-ingredients";
import { trpc } from "@/utils/trpc";
import {
  assertBreadcrumbs,
  assertLoadingSpinner,
  assertTableContents,
} from "@/__tests__/helper-functions";
import { Toaster } from "react-hot-toast";

const MOCK_ACTIVE_INGREDIENTS = {
  Paracetamol: {
    id: 1,
    name: "Paracetamol",
    unitOfMeasurement: "mg",
    fallBelow: 3000,
  },
};

const mockActiveIngredients = [MOCK_ACTIVE_INGREDIENTS.Paracetamol];

// Mock tRPC
vi.mock("@/utils/trpc", () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      medicationActiveIngredientsRouter: {
        list: {
          invalidate: vi.fn(),
        },
      },
    })),
    medicationActiveIngredientsRouter: {
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

describe("MedicationActiveIngredientsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock the mutations with default implementations
    mockTrpc.medicationActiveIngredientsRouter.create.useMutation.mockReturnValue(
      {
        mutate: vi.fn(),
      },
    );
    mockTrpc.medicationActiveIngredientsRouter.update.useMutation.mockReturnValue(
      {
        mutate: vi.fn(),
      },
    );
    mockTrpc.medicationActiveIngredientsRouter.delete.useMutation.mockReturnValue(
      {
        mutate: vi.fn(),
      },
    );

    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockImplementation(
      () => ({
        data: mockActiveIngredients,
        isLoading: false,
      }),
    );
  });

  it("renders page title and breadcrumbs", () => {
    render(<MedicationActiveIngredientsBasePage />);

    expect(
      screen.getByRole("heading", { name: "Medication Active Ingredient" }),
    ).toBeInTheDocument();

    assertBreadcrumbs([
      "Home",
      "Medication Stock",
      "Medication Active Ingredients",
    ]);
  });

  it("displays loading state", () => {
    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    render(<MedicationActiveIngredientsBasePage />);

    assertLoadingSpinner("Loading active ingredients...");
  });

  it("displays a message that there is no active ingredient if there is no data", () => {
    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(<MedicationActiveIngredientsBasePage />);

    expect(
      screen.getByText(
        "No active ingredient found. Seed the database or add a new record.",
      ),
    ).toBeInTheDocument();
  });

  it("displays active ingredients in table", async () => {
    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: mockActiveIngredients,
      isLoading: false,
    });

    render(<MedicationActiveIngredientsBasePage />);

    await waitFor(() => {
      const table = screen.getByRole("table");
      expect(table).toBeInTheDocument();
      assertTableContents(table, [
        [
          "Active Ingredient ID",
          "Active Ingredient Name",
          "Unit of Measurement",
          "Fall Below",
          "Actions",
        ],
        ["1", "Paracetamol", "mg", "3000", "EditDelete"],
      ]);
    });
  });

  it("changes EditableCell to edit state for the correct ingredient when the Edit button is clicked", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: mockActiveIngredients,
      isLoading: false,
    });

    const { container } = render(<MedicationActiveIngredientsBasePage />);

    await waitFor(() => {
      expect(screen.getByText("Paracetamol")).toContainHTML(
        '<span class="text-sm font-medium text-slate-900">Paracetamol</span>',
      );
      const nameInput = container.querySelector('input[name="name"]');
      expect(nameInput).not.toBeInTheDocument();
      const unitInput = container.querySelector(
        'input[name="unitOfMeasurement',
      );
      expect(unitInput).not.toBeInTheDocument();
      const fallBelowInput = container.querySelector('input[name="fallBelow');
      expect(fallBelowInput).not.toBeInTheDocument();
      const editButton = screen.getByRole("button", { name: "Edit" });
      const deleteButton = screen.getByRole("button", { name: "Delete" });

      expect(editButton).toBeInTheDocument();
      expect(deleteButton).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Edit" }));

    await waitFor(() => {
      // todo: our RHF forms aren't accessible directly by react testing library, need use html selectors
      const nameInput = container.querySelector('input[name="name"]');
      expect(nameInput).toBeInTheDocument();
      const unitInput = container.querySelector(
        'input[name="unitOfMeasurement',
      );
      expect(unitInput).toBeInTheDocument();
      const fallBelowInput = container.querySelector('input[name="fallBelow');
      expect(fallBelowInput).toBeInTheDocument();

      const saveButton = screen.getByRole("button", { name: "Save" });
      const cancelButton = screen.getByRole("button", { name: "Cancel" });

      expect(saveButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });
  });

  it("changes back the EditableCell to normal state when the cancel button is clicked after being in edit state", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: mockActiveIngredients,
      isLoading: false,
    });

    render(<MedicationActiveIngredientsBasePage />);

    await waitFor(() => {
      expect(screen.getByText("Paracetamol")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Edit" }));

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.getByText("Paracetamol")).toBeInTheDocument();
      expect(screen.queryAllByRole("textbox", { name: "" }).length).toBe(0);
    });
  });

  it("displays a toast rejecting edits if no form field is dirty", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: mockActiveIngredients,
      isLoading: false,
    });

    render(
      <>
        <MedicationActiveIngredientsBasePage />
        <Toaster />
      </>,
    );

    await waitFor(() => {
      expect(screen.getByText("Paracetamol")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Edit" }));

    await user.click(screen.getByRole("button", { name: "Save" }));

    const toast = await screen.findByRole("status", {}, { timeout: 3000 });
    expect(toast).toBeInTheDocument();
    expect(toast.textContent).toBe("No form field changed!");
  });

  it("rejects entering alphabets other than 'e' in the fallbelow EditableCell", () => {});

  it("displays a toast rejecting edits if an 'e' is entered into fallBelow EditableCell and saved", () => {});

  it("only accepts positive integers in the fallBelow EditableCell when a save is attempted", () => {});

  it("displays a success toast when a valid edit is made", () => {});

  it("displays a modal with the information of ingredient to be deleted when the Delete button is clicked", () => {});

  it("closes the deletion confirmation modal when the cross button or the cancel button is clicked", () => {});

  it("rejects deletion of active ingredients that are in use by medication brands with a toast and closes the modal", () => {});

  it("displays a toast confirmation if an active ingredient has been deleted", () => {});

  it("opens a modal to add new active ingredients when the Add Active Ingredient button is clicked", () => {});

  it("displays a popup when 'e' is entered into the Fall below input field and save button is clicked", () => {});

  it("closes the add new active ingredient modal when the cross button or the cancel button is clicked", () => {});

  it("closes the add new active ingredient modal, displays a success toast, and refreshes the list when a valid new ingredient is added", () => {});

  it("only accepts positive integers in the fallBelow field in the add new ingredient modal when a save is attempted", () => {});
});
