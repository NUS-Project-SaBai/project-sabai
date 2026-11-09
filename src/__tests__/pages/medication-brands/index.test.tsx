import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MedicationBrandsBasePage from "@/pages/medication-brands";
import { trpc } from "@/utils/trpc";
import {
  assertBreadcrumbs,
  assertLoadingSpinner,
  assertTableContents,
} from "@/__tests__/utils/helper-functions";
import { Toaster, toast } from "react-hot-toast";

const mockActiveIngredients = [
  {
    id: 1,
    name: "Paracetamol",
    unitOfMeasurement: "mg",
    fallBelow: 3000,
    remarks: "test",
  },
  {
    id: 2,
    name: "Ibuprofen",
    unitOfMeasurement: "tablets",
    fallBelow: 100,
    remarks: null,
  },
];

const mockBrands = [
  {
    id: 1,
    name: "Panadol",
    activeIngredientId: 1,
    activeIngredientName: "Paracetamol",
    unitOfMeasurement: "mg",
    remarks: "test",
  },
];

// Mock tRPC
vi.mock("@/utils/trpc", () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      medicationBrandRouter: {
        listWithActiveIngredientName: {
          invalidate: vi.fn(),
        },
      },
    })),
    medicationBrandRouter: {
      listWithActiveIngredientName: {
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
    medicationActiveIngredientsRouter: {
      list: {
        useQuery: vi.fn(),
      },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTrpc = trpc as any;

describe("MedicationBrandsBasePage", () => {
  const invalidate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    toast.dismissAll();

    mockTrpc.useUtils.mockReturnValue({
      medicationBrandRouter: {
        listWithActiveIngredientName: { invalidate },
      },
    });

    mockTrpc.medicationBrandRouter.create.useMutation.mockReturnValue({
      mutate: vi.fn(),
    });

    mockTrpc.medicationBrandRouter.update.useMutation.mockReturnValue({
      mutate: vi.fn(),
    });

    mockTrpc.medicationBrandRouter.delete.useMutation.mockReturnValue({
      mutate: vi.fn(),
    });

    mockTrpc.medicationBrandRouter.listWithActiveIngredientName.useQuery.mockReturnValue(
      {
        data: mockBrands,
        isLoading: false,
        isError: false,
      },
    );

    mockTrpc.medicationActiveIngredientsRouter.list.useQuery.mockReturnValue({
      data: mockActiveIngredients,
      isLoading: false,
      isError: false,
    });
  });

  afterEach(() => {
    cleanup();
    toast.dismissAll();
  });

  it("renders page title and breadcrumbs", () => {
    render(<MedicationBrandsBasePage />);

    expect(
      screen.getByRole("heading", { name: "Medication Brands" }),
    ).toBeInTheDocument();

    assertBreadcrumbs(["Home", "Medication Stock", "Medication Brands"]);
  });

  it("displays loading state", () => {
    mockTrpc.medicationBrandRouter.listWithActiveIngredientName.useQuery.mockReturnValue(
      {
        data: undefined,
        isLoading: true,
        isError: false,
      },
    );

    render(<MedicationBrandsBasePage />);

    assertLoadingSpinner("Loading brands...");
  });

  it("displays an empty-state message when there are no brands", () => {
    mockTrpc.medicationBrandRouter.listWithActiveIngredientName.useQuery.mockReturnValue(
      {
        data: [],
        isLoading: false,
        isError: false,
      },
    );

    render(<MedicationBrandsBasePage />);

    expect(
      screen.getByText(
        "No medication brands found. Seed the database or add a new record.",
      ),
    ).toBeInTheDocument();
  });

  it("displays brands and active ingredient details in the table", () => {
    render(<MedicationBrandsBasePage />);

    assertTableContents(screen.getByRole("table"), [
      [
        "Brand ID",
        "Brand Name",
        "Active Ingredient Name",
        "Unit of Measurement",
        "Remarks",
        "Actions",
      ],
      ["1", "Panadol", "Paracetamol", "mg", "test", "EditDelete"],
    ]);
  });

  it("changes EditableCell to edit state when Edit is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<MedicationBrandsBasePage />);

    expect(screen.getByText("Panadol")).toBeInTheDocument();
    expect(screen.getByText("Paracetamol")).toBeInTheDocument();

    expect(
      container.querySelector('input[name="name"]'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('input[name="remarks"]'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(
        'button[name="activeIngredientId-dropdown-button"]',
      ),
    ).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(container.querySelector('input[name="name"]')).toHaveValue(
      "Panadol",
    );
    expect(container.querySelector('input[name="remarks"]')).toHaveValue(
      "test",
    );
    expect(
      container.querySelector(
        'button[name="activeIngredientId-dropdown-button"]',
      ),
    ).toHaveTextContent("Paracetamol");

    expect(screen.getByText("mg")).toBeInTheDocument();
    expect(
      container.querySelector('input[name="unitOfMeasurement"]'),
    ).not.toBeInTheDocument();

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
  });

  it("discards edits and returns to normal state when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<MedicationBrandsBasePage />);

    await user.click(screen.getByRole("button", { name: "Edit" }));

    const nameInput =
      container.querySelector<HTMLInputElement>('input[name="name"]')!;

    await user.clear(nameInput);
    await user.type(nameInput, "Unsaved Brand");

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Panadol")).toBeInTheDocument();
    expect(screen.queryByText("Unsaved Brand")).not.toBeInTheDocument();
    expect(
      container.querySelector('input[name="name"]'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("displays a toast rejecting edits when no field changed", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();

    mockTrpc.medicationBrandRouter.update.useMutation.mockReturnValue({
      mutate,
    });

    render(
      <>
        <MedicationBrandsBasePage />
        <Toaster />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "No form field changed!",
    );
    expect(mutate).not.toHaveBeenCalled();
  });

  it("displays a success toast and refreshes the list after a valid edit", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();

    mockTrpc.medicationBrandRouter.update.useMutation.mockImplementation(
      ({ onSuccess }: { onSuccess: () => void }) => ({
        mutate: mutate.mockImplementation(() => onSuccess()),
      }),
    );

    const { container } = render(
      <>
        <MedicationBrandsBasePage />
        <Toaster />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));

    const nameInput =
      container.querySelector<HTMLInputElement>('input[name="name"]')!;

    await user.clear(nameInput);
    await user.type(nameInput, "Updated Brand");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mutate).toHaveBeenCalledWith({
      id: 1,
      name: "Updated Brand",
      activeIngredientId: 1,
      remarks: "test",
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Successfully updated!",
    );
    expect(invalidate).toHaveBeenCalledOnce();
  });

  it("updates the ingredient foreign key and displays its unit", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();

    mockTrpc.medicationBrandRouter.update.useMutation.mockReturnValue({
      mutate,
    });

    const { container } = render(<MedicationBrandsBasePage />);

    await user.click(screen.getByRole("button", { name: "Edit" }));

    const dropdown = container.querySelector(
      'button[name="activeIngredientId-dropdown-button"]',
    )!;

    expect(dropdown).toHaveTextContent("Paracetamol");

    await user.click(dropdown);
    await user.click(screen.getByRole("button", { name: "Ibuprofen" }));

    expect(screen.getByText("tablets")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(mutate).toHaveBeenCalledWith({
      id: 1,
      name: "Panadol",
      activeIngredientId: 2,
      remarks: "test",
    });
  });

  it("displays the brand details in the deletion confirmation modal", async () => {
    const user = userEvent.setup();

    render(<MedicationBrandsBasePage />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog");

    expect(
      within(dialog).getByRole("heading", { name: "Confirm Deletion?" }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText("Panadol")).toBeInTheDocument();
    expect(within(dialog).getByText("Paracetamol")).toBeInTheDocument();
    expect(within(dialog).getByText("mg")).toBeInTheDocument();
    expect(within(dialog).getByText("test")).toBeInTheDocument();
  });

  it("closes the deletion modal using Cancel or Close", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();

    mockTrpc.medicationBrandRouter.delete.useMutation.mockReturnValue({
      mutate,
    });

    render(<MedicationBrandsBasePage />);

    await user.click(screen.getByRole("button", { name: "Delete" }));

    let dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("shows a dependency error toast and closes the deletion modal", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();

    mockTrpc.medicationBrandRouter.delete.useMutation.mockImplementation(
      ({ onError }: { onError: () => void }) => ({
        mutate: mutate.mockImplementation(() => onError()),
      }),
    );

    render(
      <>
        <MedicationBrandsBasePage />
        <Toaster />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

    expect(mutate).toHaveBeenCalledWith({ id: 1 });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Error! Check that there are no stock records that depend on this brand.",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(invalidate).not.toHaveBeenCalled();
  });

  it("displays a success toast and refreshes the list after deletion", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();

    mockTrpc.medicationBrandRouter.delete.useMutation.mockImplementation(
      ({ onSuccess }: { onSuccess: () => void }) => ({
        mutate: mutate.mockImplementation(() => onSuccess()),
      }),
    );

    render(
      <>
        <MedicationBrandsBasePage />
        <Toaster />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

    expect(mutate).toHaveBeenCalledWith({ id: 1 });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Successfully deleted.",
    );
    expect(invalidate).toHaveBeenCalledOnce();
  });

  it("opens the add brand modal", async () => {
    const user = userEvent.setup();

    render(<MedicationBrandsBasePage />);

    await user.click(screen.getByRole("button", { name: "Add Brand" }));

    const dialog = await screen.findByRole("dialog");

    expect(
      within(dialog).getByRole("heading", { name: "Add New Brand" }),
    ).toBeInTheDocument();
    expect(dialog.querySelector('input[name="name"]')).toBeInTheDocument();
    expect(dialog.querySelector('input[name="remarks"]')).toBeInTheDocument();
    expect(
      dialog.querySelector('button[name="activeIngredientId-dropdown-button"]'),
    ).toBeInTheDocument();
  });

  it("requires an active ingredient before creating a brand", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();

    mockTrpc.medicationBrandRouter.create.useMutation.mockReturnValue({
      mutate,
    });

    render(<MedicationBrandsBasePage />);

    await user.click(screen.getByRole("button", { name: "Add Brand" }));

    const dialog = await screen.findByRole("dialog");
    const nameInput =
      dialog.querySelector<HTMLInputElement>('input[name="name"]')!;

    await user.type(nameInput, "New Brand");
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(
      await within(dialog).findByText("Missing Active Ingredient!"),
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("closes the add brand modal using Cancel or Close", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();

    mockTrpc.medicationBrandRouter.create.useMutation.mockReturnValue({
      mutate,
    });

    render(<MedicationBrandsBasePage />);

    await user.click(screen.getByRole("button", { name: "Add Brand" }));

    let dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add Brand" }));

    dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it("creates a brand, closes the modal, and refreshes the list", async () => {
    const user = userEvent.setup();
    const mutate = vi.fn();

    mockTrpc.medicationBrandRouter.create.useMutation.mockImplementation(
      ({ onSuccess }: { onSuccess: () => void }) => ({
        mutate: mutate.mockImplementation(() => onSuccess()),
      }),
    );

    render(
      <>
        <MedicationBrandsBasePage />
        <Toaster />
      </>,
    );

    await user.click(screen.getByRole("button", { name: "Add Brand" }));

    const dialog = await screen.findByRole("dialog");
    const nameInput =
      dialog.querySelector<HTMLInputElement>('input[name="name"]')!;
    const remarksInput = dialog.querySelector<HTMLInputElement>(
      'input[name="remarks"]',
    )!;

    await user.type(nameInput, "New Brand");
    await user.type(remarksInput, "New remarks");

    await user.click(
      dialog.querySelector(
        'button[name="activeIngredientId-dropdown-button"]',
      )!,
    );
    await user.click(
      within(dialog).getByRole("button", { name: "Paracetamol" }),
    );
    await user.click(within(dialog).getByRole("button", { name: "Save" }));

    expect(mutate).toHaveBeenCalledWith({
      name: "New Brand",
      activeIngredientId: 1,
      remarks: "New remarks",
    });
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Successfully created!",
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(invalidate).toHaveBeenCalledOnce();
  });
});
