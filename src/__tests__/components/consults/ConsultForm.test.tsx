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
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTrpc = trpc as any;

const VISIT_ID = 10;

// mutate default: invoke the success callback so onSuccess side-effects run
let mutate: ReturnType<typeof vi.fn>;
let invalidate: ReturnType<typeof vi.fn>;

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

describe("ConsultForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toast.remove();

    invalidate = vi.fn();
    mutate = vi.fn(
      (
        _input: unknown,
        opts?: { onSuccess?: () => void; onError?: () => void },
      ) => opts?.onSuccess?.(),
    );

    mockTrpc.useUtils.mockReturnValue({
      consultsRouter: { getByVisitId: { invalidate } },
    });
    mockTrpc.consultsRouter.create.useMutation.mockReturnValue({
      mutate,
      isPending: false,
    });
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
      expect.anything(),
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

  test("shows the save button in a loading state while pending", () => {
    mockTrpc.consultsRouter.create.useMutation.mockReturnValue({
      mutate,
      isPending: true,
    });

    renderForm();

    expect(screen.getByRole("button", { name: "Save Consult" })).toBeDisabled();
  });
});
