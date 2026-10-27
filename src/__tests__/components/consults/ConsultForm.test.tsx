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
    referralRouter: {
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
let referralMutate: ReturnType<typeof vi.fn>;
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

/** Fills required fields and the single diagnosis with valid values. */
async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/Past Medical History/), "No history");
  await user.type(screen.getByLabelText(/Consultation/), "Patient is well");
  await user.click(screen.getByRole("button", { name: "Choose a category" }));
  await user.click(screen.getByRole("button", { name: "Cardiovascular" }));
  await user.type(screen.getByLabelText(/Details/), "Hypertension");
}

/** Selects a referral category from the dropdown. */
async function selectReferralCategory(
  user: ReturnType<typeof userEvent.setup>,
  category: string,
) {
  await user.click(screen.getByRole("button", { name: "Not Referred" }));
  await user.click(screen.getByRole("button", { name: category }));
}

/** Opens the order modal and saves one order for the seeded ingredient. */
async function addOrder(
  user: ReturnType<typeof userEvent.setup>,
  quantity: number,
  dosageInstructions = "Twice daily",
) {
  await user.click(screen.getByRole("button", { name: "Add Order" }));
  // Modal opens the <dialog> inside a requestAnimationFrame, so wait for it —
  // until it is open, its contents are hidden from role queries.
  await user.click(
    await screen.findByRole("button", { name: "Select an option" }),
  );
  await user.click(screen.getByRole("button", { name: /^Paracetamol,/ }));
  await user.type(screen.getByLabelText(/Quantity to Order/), `${quantity}`);
  await user.type(
    screen.getByLabelText(/Dosage Instructions/),
    dosageInstructions,
  );
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
    referralMutate = vi.fn();

    mockTrpc.useUtils.mockReturnValue({
      consultsRouter: { getByVisitId: { invalidate } },
      medicationStockRouter: { invalidate: invalidateStock },
    });
    mockTrpc.consultsRouter.create.useMutation.mockReturnValue({
      mutateAsync: createConsult,
    });
    mockTrpc.referralRouter.create.useMutation.mockReturnValue({
      mutate: referralMutate,
      isPending: false,
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
    expect(screen.getByText(/Referred for/)).toBeInTheDocument();
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

  test("rejects whitespace-only dosage instructions", async () => {
    const user = userEvent.setup();
    renderForm();

    await addOrder(user, 10, "   ");

    await waitFor(() =>
      expect(
        screen.getByText("Missing Dosage Instructions!"),
      ).toBeInTheDocument(),
    );
    // the modal stays open and nothing is staged
    expect(
      screen.getByRole("button", { name: "Save Order" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/^Quantity: /)).not.toBeInTheDocument();
  });

  test("counts staged orders against the available stock", async () => {
    const user = userEvent.setup();
    renderForm();

    await addOrder(user, 30);
    await addOrder(user, 30);

    await waitFor(() =>
      expect(
        screen.getByText("Only 20 tablets available."),
      ).toBeInTheDocument(),
    );
    // the dropdown shows what is left after the staged order
    expect(
      screen.getByRole("button", { name: "Paracetamol, (tablets) (Qty: 20)" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText(/^Quantity: /)).toHaveLength(1);
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

  describe("referral section", () => {
    test("renders the referral dropdown and hides Referral Notes by default", () => {
      // Given - form is rendered with default values
      renderForm();
      // Then - dropdown shows "Not Referred" and notes textarea is hidden
      expect(
        screen.getByRole("button", { name: "Not Referred" }),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/Referral Notes/)).not.toBeInTheDocument();
    });

    test("shows Referral Notes when a referral category is selected", async () => {
      // Given - form is rendered
      const user = userEvent.setup();
      renderForm();
      // When - user picks a referral category
      await selectReferralCategory(user, "Diagnostic");
      // Then - referral notes textarea appears
      expect(screen.getByLabelText(/Referral Notes/)).toBeInTheDocument();
    });

    test("hides Referral Notes when Not Referred is re-selected", async () => {
      // Given - notes are visible after selecting a category
      const user = userEvent.setup();
      renderForm();
      await selectReferralCategory(user, "Diagnostic");
      expect(screen.getByLabelText(/Referral Notes/)).toBeInTheDocument();
      // When - user selects "Not Referred" again
      await user.click(screen.getByRole("button", { name: "Diagnostic" }));
      await user.click(screen.getByRole("button", { name: "Not Referred" }));
      // Then - referral notes field is hidden
      expect(screen.queryByLabelText(/Referral Notes/)).not.toBeInTheDocument();
    });

    test("does not call createReferral when referral is Not Referred", async () => {
      // Given - form is filled with no referral selected (default)
      const user = userEvent.setup();
      renderForm();
      await fillValidForm(user);
      // When - form is submitted
      await user.click(screen.getByRole("button", { name: "Save Consult" }));
      // Then - referral mutation is never called
      await waitFor(() => expect(createConsult).toHaveBeenCalledTimes(1));
      expect(referralMutate).not.toHaveBeenCalled();
    });

    test("calls createReferral with the correct payload after consult is saved", async () => {
      // Given - form is filled with a referral category and notes
      const user = userEvent.setup();
      renderForm();
      await fillValidForm(user);
      await selectReferralCategory(user, "Diagnostic");
      await user.type(
        screen.getByLabelText(/Referral Notes/),
        "Check blood work",
      );
      // When - form is submitted
      await user.click(screen.getByRole("button", { name: "Save Consult" }));
      // Then - referral mutation is called with consult id and referral data
      await waitFor(() => expect(referralMutate).toHaveBeenCalledTimes(1));
      expect(referralMutate).toHaveBeenCalledWith(
        {
          consultId: CONSULT_ID,
          referredFor: "Diagnostic",
          referralNotes: "Check blood work",
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
    });

    test("omits referralNotes from the payload when notes are left empty", async () => {
      // Given - form is filled with a referral category but no notes
      const user = userEvent.setup();
      renderForm();
      await fillValidForm(user);
      await selectReferralCategory(user, "Acute");
      // When - form is submitted without filling in referral notes
      await user.click(screen.getByRole("button", { name: "Save Consult" }));
      // Then - referralNotes is undefined in the payload
      await waitFor(() => expect(referralMutate).toHaveBeenCalledTimes(1));
      expect(referralMutate).toHaveBeenCalledWith(
        expect.objectContaining({ referralNotes: undefined }),
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
    });

    test("trims whitespace-only referral notes to undefined", async () => {
      // Given - referral notes filled with only spaces
      const user = userEvent.setup();
      renderForm();
      await fillValidForm(user);
      await selectReferralCategory(user, "Diagnostic");
      await user.type(screen.getByLabelText(/Referral Notes/), "   ");
      // When
      await user.click(screen.getByRole("button", { name: "Save Consult" }));
      // Then - referralNotes is undefined, not a whitespace string
      await waitFor(() => expect(referralMutate).toHaveBeenCalledTimes(1));
      expect(referralMutate).toHaveBeenCalledWith(
        expect.objectContaining({ referralNotes: undefined }),
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
    });

    test("shows a referral success toast after the referral is submitted", async () => {
      // Given - referral mutation auto-resolves
      referralMutate = vi.fn(
        (_input: unknown, opts?: { onSuccess?: () => void }) =>
          opts?.onSuccess?.(),
      );
      mockTrpc.referralRouter.create.useMutation.mockReturnValue({
        mutate: referralMutate,
        isPending: false,
      });
      const user = userEvent.setup();
      renderForm();
      await fillValidForm(user);
      await selectReferralCategory(user, "Diagnostic");
      // When - form is submitted
      await user.click(screen.getByRole("button", { name: "Save Consult" }));
      // Then - a referral success toast is shown
      await waitFor(() => {
        const toasts = screen.getAllByRole("status");
        expect(
          toasts.some((el) => el.textContent === "Referral submitted!"),
        ).toBe(true);
      });
    });

    test("shows an error toast when referral submission fails", async () => {
      // Given - referral mutation auto-rejects
      referralMutate = vi.fn(
        (_input: unknown, opts?: { onError?: () => void }) => opts?.onError?.(),
      );
      mockTrpc.referralRouter.create.useMutation.mockReturnValue({
        mutate: referralMutate,
        isPending: false,
      });
      const user = userEvent.setup();
      renderForm();
      await fillValidForm(user);
      await selectReferralCategory(user, "Diagnostic");
      // When - form is submitted
      await user.click(screen.getByRole("button", { name: "Save Consult" }));
      // Then - a referral error toast is shown
      await waitFor(() => {
        const toasts = screen.getAllByRole("status");
        expect(
          toasts.some((el) => el.textContent === "Failed to create referral."),
        ).toBe(true);
      });
    });

    test("resets referral fields to defaults after successful submission", async () => {
      // Given - form is filled with a referral category
      const user = userEvent.setup();
      renderForm();
      await fillValidForm(user);
      await selectReferralCategory(user, "Diagnostic");
      expect(screen.getByLabelText(/Referral Notes/)).toBeInTheDocument();
      // When - form is submitted successfully
      await user.click(screen.getByRole("button", { name: "Save Consult" }));
      // Then - referral notes are hidden and dropdown resets to "Not Referred"
      await waitFor(() => expect(createConsult).toHaveBeenCalledTimes(1));
      await waitFor(() =>
        expect(
          screen.queryByLabelText(/Referral Notes/),
        ).not.toBeInTheDocument(),
      );
      expect(
        screen.getByRole("button", { name: "Not Referred" }),
      ).toBeInTheDocument();
    });

    test("disables the save button while the referral mutation is pending", () => {
      // Given - referral mutation is in-flight
      mockTrpc.referralRouter.create.useMutation.mockReturnValue({
        mutate: referralMutate,
        isPending: true,
      });
      renderForm();
      // Then - button is disabled
      expect(
        screen.getByRole("button", { name: "Save Consult" }),
      ).toBeDisabled();
    });
  });
});
