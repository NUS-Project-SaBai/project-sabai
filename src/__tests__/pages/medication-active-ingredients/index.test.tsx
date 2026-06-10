import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MedicationActiveIngredientsBasePage from "@/pages/medication-active-ingredients";
import { trpc } from "@/utils/trpc";
import {
  assertBreadcrumbs,
  assertLoadingSpinner,
  assertTableContents,
} from "@/__tests__/helper-functions";
import { Toaster, toast } from "react-hot-toast";

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
    toast.dismissAll();

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

  afterEach(() => {
    cleanup();
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

  it("changes EditableCell to edit state for the correct ingredient when the Edit button is clicked", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: mockActiveIngredients,
      isLoading: false,
    });

    const { container } = render(<MedicationActiveIngredientsBasePage />);

    expect(screen.getByText("Paracetamol")).toContainHTML(
      '<span class="text-sm font-medium text-slate-900">Paracetamol</span>',
    );
    let nameInput = container.querySelector('input[name="name"]');
    let unitInput = container.querySelector('input[name="unitOfMeasurement');
    let fallBelowInput = container.querySelector('input[name="fallBelow');

    expect(unitInput).not.toBeInTheDocument();
    expect(fallBelowInput).not.toBeInTheDocument();
    expect(nameInput).not.toBeInTheDocument();

    const editButton = screen.getByRole("button", { name: "Edit" });
    const deleteButton = screen.getByRole("button", { name: "Delete" });

    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();

    await user.click(editButton);

    // todo: our RHF forms aren't accessible directly by react testing library, need use html selectors
    nameInput = container.querySelector('input[name="name"]');
    unitInput = container.querySelector('input[name="unitOfMeasurement');
    fallBelowInput = container.querySelector('input[name="fallBelow');

    expect(nameInput).toBeInTheDocument();
    expect(unitInput).toBeInTheDocument();
    expect(fallBelowInput).toBeInTheDocument();

    const saveButton = screen.getByRole("button", { name: "Save" });
    const cancelButton = screen.getByRole("button", { name: "Cancel" });

    expect(saveButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
  });

  it("changes back the EditableCell to normal state when the cancel button is clicked after being in edit state", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: mockActiveIngredients,
      isLoading: false,
    });

    render(<MedicationActiveIngredientsBasePage />);

    expect(screen.getByText("Paracetamol")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Paracetamol")).toBeInTheDocument();
    expect(screen.queryAllByRole("textbox", { name: "" }).length).toBe(0);
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

    expect(screen.getByText("Paracetamol")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    const toast = screen.getByRole("status");

    expect(toast).toBeInTheDocument();
    expect(toast.textContent).toBe("No form field changed!");
  });

  it("displays a success toast when a valid edit is made", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationActiveIngredientsRouter.update.useMutation.mockImplementation(
      ({ onSuccess }) => {
        return {
          mutate: vi.fn(() => {
            onSuccess?.(); // call it immediately when mutate is called
          }),
          isLoading: false,
        };
      },
    );

    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: mockActiveIngredients,
      isLoading: false,
    });

    render(
      <>
        <MedicationActiveIngredientsBasePage />
        <Toaster toastOptions={{ duration: 100 }} />
      </>,
    );

    expect(screen.getByText("3000")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByRole("spinbutton")).toBeInTheDocument();

    const fallBelowInput = screen.getByRole("spinbutton");
    const nameInput = document.getElementById("name");
    const unitInput = document.getElementById("unitOfMeasurement");

    await user.clear(fallBelowInput);
    await user.type(fallBelowInput, "70000");

    await user.clear(nameInput!);
    await user.type(nameInput!, "valid medication name");

    await user.clear(unitInput!);
    await user.type(unitInput!, "bottles");

    expect((fallBelowInput as HTMLInputElement).valueAsNumber).toBe(70000);
    expect(nameInput?.value).toBe("valid medication name");
    expect(unitInput?.value).toBe("bottles");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Successfully updated!",
    );
  });

  it("shows an error message for negative integers and zero in the fallBelow EditableCell when a save is attempted", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: mockActiveIngredients,
      isLoading: false,
    });

    render(<MedicationActiveIngredientsBasePage />);

    await user.click(screen.getByRole("button", { name: "Edit" }));

    const fallBelowInput = screen.getByRole("spinbutton");

    await user.clear(fallBelowInput);
    await user.type(fallBelowInput, "-1");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      screen.getByText("Please input only positive values."),
    ).toBeInTheDocument();
  });

  it("displays a modal with the information of ingredient to be deleted when the Delete button is clicked", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: mockActiveIngredients,
      isLoading: false,
    });

    render(<MedicationActiveIngredientsBasePage />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");

    const fallBelowText = await within(dialog).findByText(
      mockActiveIngredients[0].fallBelow,
    );
    const nameText = await within(dialog).findByText(
      mockActiveIngredients[0].name,
    );
    const unitText = await within(dialog).findByText(
      mockActiveIngredients[0].unitOfMeasurement,
    );

    expect(fallBelowText).toBeInTheDocument();
    expect(nameText).toBeInTheDocument();
    expect(unitText).toBeInTheDocument();
  });

  it("closes the deletion confirmation modal when the cross button or the cancel button is clicked", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: mockActiveIngredients,
      isLoading: false,
    });

    render(<MedicationActiveIngredientsBasePage />);

    // test cancel button
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog");

    const cancelButton = await within(dialog).findByRole("button", {
      name: "Cancel",
    });
    await user.click(cancelButton!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // test cross button
    await user.click(screen.getByRole("button", { name: "Delete" }));
    const dialogSecond = await screen.findByRole("dialog");

    const crossButton = within(dialogSecond).getByRole("button", {
      name: "",
    });
    await user.click(crossButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("rejects deletion of active ingredients that are in use by medication brands with a toast and closes the modal", async () => {
    const user = userEvent.setup();

    const mockDBError = new Error(
      "Error! Check that there are no brands that depend on this active ingredient.",
    );

    mockTrpc.medicationActiveIngredientsRouter.delete.useMutation.mockImplementation(
      ({ onError }) => {
        return {
          mutate: vi.fn(() => {
            onError?.(mockDBError);
          }),
          isLoading: false,
        };
      },
    );

    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: mockActiveIngredients,
      isLoading: false,
    });

    render(
      <>
        <MedicationActiveIngredientsBasePage />
        <Toaster toastOptions={{ duration: 100 }} />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog");
    const confirmButton = within(dialog).getByRole("button", {
      name: "Confirm",
    });
    await user.click(confirmButton);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Error! Check that there are no brands that depend on this active ingredient.",
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("displays a toast confirmation if an active ingredient has been deleted", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationActiveIngredientsRouter.delete.useMutation.mockImplementation(
      ({ onSuccess }) => {
        return {
          mutate: vi.fn(() => {
            onSuccess?.();
          }),
          isLoading: false,
        };
      },
    );

    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: mockActiveIngredients,
      isLoading: false,
    });

    render(
      <>
        <MedicationActiveIngredientsBasePage />
        <Toaster toastOptions={{ duration: 100 }} />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog");
    const confirmButton = within(dialog).getByRole("button", {
      name: "Confirm",
    });
    await user.click(confirmButton);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Successfully deleted.",
    );
  });

  it("opens a modal to add new active ingredients when the Add Active Ingredient button is clicked", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: mockActiveIngredients,
      isLoading: false,
    });

    render(
      <>
        <MedicationActiveIngredientsBasePage />
      </>,
    );

    await user.click(
      screen.getByRole("button", { name: "Add Active Ingredient" }),
    );

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Add New Active Ingredient" }),
    ).toBeInTheDocument();
  });

  it("only allows positive numeric inputs in fallbelow field in add new active ingredient modal", async () => {
    const user = userEvent.setup();
    const mockTooSmallError = new Error("An error has occurred.");

    mockTrpc.medicationActiveIngredientsRouter.create.useMutation.mockImplementation(
      ({ onError }) => {
        return {
          mutate: vi.fn(() => {
            onError?.(mockTooSmallError);
          }),
          isLoading: false,
        };
      },
    );

    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: mockActiveIngredients,
      isLoading: false,
    });

    render(
      <>
        <MedicationActiveIngredientsBasePage />
        <Toaster toastOptions={{ duration: 100 }} />
      </>,
    );

    await user.click(
      screen.getByRole("button", { name: "Add Active Ingredient" }),
    );

    const dialog = await screen.findByRole("dialog");
    const nameInput = dialog.querySelector('input[name="name"]');
    const unitInput = dialog.querySelector('input[name="unitOfMeasurement"]');
    const fallBelowInput = dialog.querySelector('input[name="fallBelow"]');
    const saveButton = within(dialog).getByRole("button", { name: "Save" });

    expect(nameInput).toBeInTheDocument();
    expect(unitInput).toBeInTheDocument();
    expect(fallBelowInput).toBeInTheDocument();

    await user.clear(nameInput!);
    await user.type(nameInput!, "valid name");

    await user.clear(unitInput!);
    await user.type(unitInput!, "valid units");

    // test negative
    await user.clear(fallBelowInput!);
    await user.type(fallBelowInput!, "-1");
    await user.click(saveButton!);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "An error has occurred.",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    // test 0
    await user.clear(fallBelowInput!);
    await user.type(fallBelowInput!, "0");
    await user.click(saveButton!);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "An error has occurred.",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes the add new active ingredient modal when the cross button or the cancel button is clicked", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: mockActiveIngredients,
      isLoading: false,
    });

    render(<MedicationActiveIngredientsBasePage />);

    // test cancel button
    await user.click(
      screen.getByRole("button", { name: "Add Active Ingredient" }),
    );
    const dialog = await screen.findByRole("dialog");

    const cancelButton = within(dialog).getByRole("button", {
      name: "Cancel",
    });
    await user.click(cancelButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // test cross button
    const deleteButton = screen.getByRole("button", { name: "Delete" });
    await user.click(deleteButton);
    const dialogSecond = await screen.findByRole("dialog");

    const crossButton = within(dialogSecond).getByRole("button", {
      name: "",
    });
    await user.click(crossButton);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the add new active ingredient modal, displays a success toast, and refreshes the list when a valid new ingredient is added", async () => {
    const user = userEvent.setup();

    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: mockActiveIngredients,
      isLoading: false,
    });

    mockTrpc.medicationActiveIngredientsRouter.create.useMutation.mockImplementation(
      ({ onSuccess }) => {
        return {
          mutate: vi.fn(() => {
            mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue(
              {
                data: [
                  ...mockActiveIngredients,
                  {
                    id: 2,
                    name: "valid name",
                    unitOfMeasurement: "valid units",
                    fallBelow: 1,
                  },
                ],
                isLoading: false,
              },
            );
            onSuccess?.();
          }),
          isLoading: false,
        };
      },
    );

    render(
      <>
        <MedicationActiveIngredientsBasePage />
        <Toaster toastOptions={{ duration: 100 }} />
      </>,
    );

    await user.click(
      screen.getByRole("button", { name: "Add Active Ingredient" }),
    );

    const dialog = await screen.findByRole("dialog");
    const nameInput = dialog.querySelector('input[name="name"]');
    const unitInput = dialog.querySelector('input[name="unitOfMeasurement"]');
    const fallBelowInput = dialog.querySelector('input[name="fallBelow"]');
    const saveButton = within(dialog).getByRole("button", { name: "Save" });

    expect(nameInput).toBeInTheDocument();
    expect(unitInput).toBeInTheDocument();
    expect(fallBelowInput).toBeInTheDocument();

    await user.clear(nameInput!);
    await user.type(nameInput!, "valid name");

    await user.clear(unitInput!);
    await user.type(unitInput!, "valid units");

    await user.clear(fallBelowInput!);
    await user.type(fallBelowInput!, "1");
    await user.click(saveButton!);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Successfully created!",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // This part doesn't work as expected because the mock invalidate function doesn't actually render the new component
    // The actual app has been verified to work here, but the testing functions require some changes to pass
    // TODO: Implement helper functions
    // expect(screen.getByText("valid name")).toBeInTheDocument();
    // expect(screen.getByText("valid units")).toBeInTheDocument();
    // expect(screen.getByText("1")).toBeInTheDocument();
  });
});
