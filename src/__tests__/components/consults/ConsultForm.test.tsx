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
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTrpc = trpc as any;

const VISIT_ID = 10;
const FAKE_CONSULT = { id: 42 };

let mutate: ReturnType<typeof vi.fn>;
let referralMutate: ReturnType<typeof vi.fn>;
let invalidate: ReturnType<typeof vi.fn>;

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

describe("ConsultForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toast.remove();

    invalidate = vi.fn();
    mutate = vi.fn(
      (
        _input: unknown,
        opts?: {
          onSuccess?: (result: { id: number }) => void;
          onError?: () => void;
        },
      ) => opts?.onSuccess?.(FAKE_CONSULT),
    );
    referralMutate = vi.fn();

    mockTrpc.useUtils.mockReturnValue({
      consultsRouter: { getByVisitId: { invalidate } },
    });
    mockTrpc.consultsRouter.create.useMutation.mockReturnValue({
      mutate,
      isPending: false,
    });
    mockTrpc.referralRouter.create.useMutation.mockReturnValue({
      mutate: referralMutate,
      isPending: false,
    });
  });

  test("renders all fields and the save button", () => {
    renderForm();

    expect(screen.getByLabelText(/Past Medical History/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Consultation/)).toBeInTheDocument();
    expect(screen.getByText("Diagnosis 1")).toBeInTheDocument();
    expect(screen.getByLabelText(/Plan/)).toBeInTheDocument();
    expect(screen.getByText(/Referral for/)).toBeInTheDocument();
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
    expect(mutate).not.toHaveBeenCalled();
  });

  test("submits the mapped payload when the form fields are valid", async () => {
    const user = userEvent.setup();
    renderForm();

    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Save Consult" }));

    await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
    expect(mutate).toHaveBeenCalledWith(
      expect.objectContaining({
        visitId: VISIT_ID,
        pastMedicalHistory: "No history",
        consultation: "Patient is well",
        // blank optional fields collapse to undefined
        treatmentPlan: undefined,
        remarks: undefined,
        diagnoses: [{ details: "Hypertension", category: "Cardiovascular" }],
      }),
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      }),
    );
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
    expect(mutate).not.toHaveBeenCalled();
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

  test("disables the save button while the consult mutation is pending", () => {
    // Given - consult mutation is in-flight
    mockTrpc.consultsRouter.create.useMutation.mockReturnValue({
      mutate,
      isPending: true,
    });
    renderForm();
    // Then - button is disabled
    expect(screen.getByRole("button", { name: "Save Consult" })).toBeDisabled();
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
      await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
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
          consultId: FAKE_CONSULT.id,
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
      await waitFor(() => expect(mutate).toHaveBeenCalledTimes(1));
      expect(screen.queryByLabelText(/Referral Notes/)).not.toBeInTheDocument();
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
