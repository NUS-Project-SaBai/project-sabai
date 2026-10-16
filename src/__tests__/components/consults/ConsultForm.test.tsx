import { ConsultForm } from "@/components/consults/ConsultForm";
import { trpc } from "@/utils/trpc";
import { Toaster, toast } from "react-hot-toast";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/utils/trpc", () => ({
  trpc: {
    useUtils: vi.fn(),
    consultsRouter: {
      create: { useMutation: vi.fn() },
    },
    ordersRouter: {
      create: { useMutation: vi.fn() },
    },
    medicationStockRouter: {
      listGroupByActiveIngredient: { useQuery: vi.fn() },
    },
  },
}));

// jsdom has no <dialog> implementation, and Modal calls showModal() on mount.
// The stubs must toggle `open`, or the dialog's contents stay hidden from
// Testing Library's role queries.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (
    this: HTMLDialogElement,
  ) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTrpc = trpc as any;

const VISIT_ID = 10;
const CONSULT_ID = 99;

const INGREDIENTS = [
  {
    id: 3,
    activeIngredientName: "Paracetamol",
    unitOfMeasurement: "tablets",
    quantity: "50",
  },
];

let createConsult: ReturnType<typeof vi.fn>;
let createOrder: ReturnType<typeof vi.fn>;
let invalidate: ReturnType<typeof vi.fn>;
let invalidateStock: ReturnType<typeof vi.fn>;

function renderForm() {
  return render(
    <>
      <Toaster />
      <ConsultForm visitId={VISIT_ID} />
    </>,
  );
}

/** Fills the two required text fields and the single diagnosis with valid values. */
async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Past Medical History/), "No history");
  await user.type(screen.getByLabelText(/Consultation/), "Patient is well");
  await user.click(screen.getByRole("button", { name: "Choose a category" }));
  await user.click(screen.getByRole("button", { name: "Cardiovascular" }));
  await user.type(screen.getByLabelText(/Details/), "Hypertension");
}

/** Opens the order modal and saves one order for the seeded ingredient. */
async function addOrder(
  user: ReturnType<typeof userEvent.setup>,
  quantity: number,
) {
  await user.click(screen.getByRole("button", { name: "Add Order" }));
  // Modal opens the <dialog> inside a requestAnimationFrame, so wait for it —
  // until it is open, its contents are hidden from role queries.
  await user.click(
    await screen.findByRole("button", { name: "Select an option" }),
  );
  await user.click(
    screen.getByRole("button", { name: "Paracetamol, (tablets) (Qty: 50)" }),
  );
  await user.type(screen.getByLabelText(/Quantity to Order/), `${quantity}`);
  await user.type(screen.getByLabelText(/Dosage Instructions/), "Twice daily");
  await user.click(screen.getByRole("button", { name: "Save Order" }));
}

describe("ConsultForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toast.remove();

    invalidate = vi.fn();
    invalidateStock = vi.fn();
    createConsult = vi.fn().mockResolvedValue({ id: CONSULT_ID });
    createOrder = vi.fn().mockResolvedValue({ id: 1 });

    mockTrpc.useUtils.mockReturnValue({
      consultsRouter: { getByVisitId: { invalidate } },
      medicationStockRouter: { invalidate: invalidateStock },
    });
    mockTrpc.consultsRouter.create.useMutation.mockReturnValue({
      mutateAsync: createConsult,
    });
    mockTrpc.ordersRouter.create.useMutation.mockReturnValue({
      mutateAsync: createOrder,
    });
    mockTrpc.medicationStockRouter.listGroupByActiveIngredient.useQuery.mockReturnValue(
      { data: INGREDIENTS, isLoading: false, isError: false },
    );
  });

  test("renders all fields and the save button", () => {
    renderForm();

    expect(screen.getByLabelText(/Past Medical History/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Consultation/)).toBeInTheDocument();
    expect(screen.getByText("Diagnosis 1")).toBeInTheDocument();
    expect(screen.getByLabelText(/Plan/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Remarks/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save Consult" }),
    ).toBeInTheDocument();
  });

  test("blocks submit and shows an error toast when required fields are empty", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Save Consult" }));

    await waitFor(() => {
      const status = screen.getByRole("status");
      expect(status.textContent).toBe(
        "Please fill in all required fields before saving.",
      );
    });
    expect(createConsult).not.toHaveBeenCalled();
  });

  test("submits the mapped payload when the form fields are valid", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Save Consult" }));

    await waitFor(() => expect(createConsult).toHaveBeenCalledTimes(1));
    expect(createConsult).toHaveBeenCalledWith(
      expect.objectContaining({
        visitId: VISIT_ID,
        pastMedicalHistory: "No history",
        consultation: "Patient is well",
        // blank optional fields collapse to undefined
        treatmentPlan: undefined,
        remarks: undefined,
        diagnoses: [{ details: "Hypertension", category: "Cardiovascular" }],
      }),
    );
    // no orders staged, so stock is left alone
    expect(createOrder).not.toHaveBeenCalled();
    expect(invalidateStock).not.toHaveBeenCalled();
  });

  test("does not allow submit when diagnosis fields are empty", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(
      screen.getByLabelText(/Past Medical History/),
      "No history",
    );
    await user.type(screen.getByLabelText(/Consultation/), "Patient is well");

    await user.click(screen.getByRole("button", { name: "Save Consult" }));

    await waitFor(() => {
      const status = screen.getByRole("status");
      expect(status.textContent).toBe(
        "Please fill in all required fields before saving.",
      );
    });
    expect(createConsult).not.toHaveBeenCalled();
  });

  test("adds and removes diagnosis fields", async () => {
    const user = userEvent.setup();
    renderForm();

    // only one diagnosis: Remove button is hidden
    expect(
      screen.queryByRole("button", { name: "Remove" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add Diagnosis" }));
    expect(screen.getByText("Diagnosis 2")).toBeInTheDocument();

    // with two, both Remove buttons are visible; removing one hides the button again
    const removeButtons = screen.getAllByRole("button", { name: "Remove" });
    expect(removeButtons).toHaveLength(2);
    await user.click(removeButtons[0]);

    expect(screen.queryByText("Diagnosis 2")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove" }),
    ).not.toBeInTheDocument();
  });

  test("shows the save button in a loading state while saving", async () => {
    const user = userEvent.setup();
    let releaseConsult: (consult: { id: number }) => void = () => {};
    createConsult.mockReturnValue(
      new Promise<{ id: number }>((resolve) => {
        releaseConsult = resolve;
      }),
    );

    renderForm();
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Save Consult" }));

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Save Consult" }),
      ).toBeDisabled(),
    );

    releaseConsult({ id: CONSULT_ID });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Save Consult" }),
      ).toBeEnabled(),
    );
  });

  test("stages an order from the modal and creates it against the saved consult", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillValidForm(user);
    await addOrder(user, 30);

    // the staged order is listed on the consult form
    expect(screen.getByText("Paracetamol")).toBeInTheDocument();
    expect(screen.getByText("Quantity: 30")).toBeInTheDocument();
    expect(screen.getByText("Twice daily")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save Consult" }));

    await waitFor(() => expect(createOrder).toHaveBeenCalledTimes(1));
    expect(createOrder).toHaveBeenCalledWith({
      consultId: CONSULT_ID,
      activeIngredientId: 3,
      quantity: 30,
      dosageInstructions: "Twice daily",
    });
    expect(invalidateStock).toHaveBeenCalled();
  });

  test("removes a staged order before saving", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillValidForm(user);
    await addOrder(user, 30);

    // the single diagnosis has no Remove button, so this is the order's
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(screen.queryByText("Paracetamol")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save Consult" }));

    await waitFor(() => expect(createConsult).toHaveBeenCalledTimes(1));
    expect(createOrder).not.toHaveBeenCalled();
  });

  test("rejects an order larger than the available stock", async () => {
    const user = userEvent.setup();
    renderForm();

    await addOrder(user, 500);

    await waitFor(() =>
      expect(
        screen.getByText("Only 50 tablets available."),
      ).toBeInTheDocument(),
    );
    // the modal stays open and nothing is staged
    expect(
      screen.getByRole("button", { name: "Save Order" }),
    ).toBeInTheDocument();
  });

  test("keeps the consult and warns when an order cannot be filled", async () => {
    const user = userEvent.setup();
    createOrder.mockRejectedValue(
      new Error("Insufficient stock: 10 of 30 available."),
    );
    renderForm();

    await fillValidForm(user);
    await addOrder(user, 30);
    await user.click(screen.getByRole("button", { name: "Save Consult" }));

    await waitFor(() => {
      const status = screen.getByRole("status");
      expect(status.textContent).toContain(
        "Consult saved, but 1 order(s) could not be filled",
      );
      expect(status.textContent).toContain("Paracetamol");
    });
    expect(createConsult).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith({ visitId: VISIT_ID });
  });
});
