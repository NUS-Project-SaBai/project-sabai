import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditPatientDetailsButton } from "@/components/patient/EditPatientDetailsButton";

const mockTrpc = vi.hoisted(() => ({
  patientsRouter: {
    getById: { useQuery: vi.fn() },
  },
}));

vi.mock("@/utils/trpc", () => ({ trpc: mockTrpc }));

// EditPatientForm has its own tests; stand in for it so these tests only cover
// opening the modal, loading the patient, and what happens after a save.
vi.mock("@/components/patient/EditPatientForm", () => ({
  default: ({
    patient,
    onSuccess,
  }: {
    patient: { name: string };
    onSuccess?: () => void;
  }) => (
    <div>
      <p>Editing {patient.name}</p>
      <button type="button" onClick={onSuccess}>
        Mock save
      </button>
    </div>
  ),
}));

const PATIENT = { id: 12, name: "Alice Tan" };

function mockPatient(result: Record<string, unknown>) {
  mockTrpc.patientsRouter.getById.useQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    ...result,
  });
}

describe("EditPatientDetailsButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPatient({ data: PATIENT });
  });

  afterEach(() => {
    cleanup();
  });

  it("only fetches the patient once the modal is opened", async () => {
    // Given - the button on its own
    const user = userEvent.setup();
    render(<EditPatientDetailsButton patientId={12} />);
    // Then - the patient query is disabled and no modal shows
    expect(mockTrpc.patientsRouter.getById.useQuery).toHaveBeenLastCalledWith(
      { id: 12 },
      { enabled: false },
    );
    expect(screen.queryByText("Editing Alice Tan")).not.toBeInTheDocument();
    // When - the button is clicked
    await user.click(
      screen.getByRole("button", { name: "Edit Patient Details" }),
    );
    // Then - the patient is fetched and the form opens with it
    expect(mockTrpc.patientsRouter.getById.useQuery).toHaveBeenLastCalledWith(
      { id: 12 },
      { enabled: true },
    );
    expect(screen.getByText("Editing Alice Tan")).toBeInTheDocument();
  });

  it("shows a spinner while the patient loads", async () => {
    // Given - the patient is still loading
    mockPatient({ isLoading: true });
    const user = userEvent.setup();
    render(<EditPatientDetailsButton patientId={12} />);
    // When - the modal is opened
    await user.click(
      screen.getByRole("button", { name: "Edit Patient Details" }),
    );
    // Then - a spinner shows instead of the form
    expect(screen.getByText("Loading patient...")).toBeInTheDocument();
  });

  it("shows a message when the patient does not exist", async () => {
    // Given - no patient matches the id
    mockPatient({ data: null });
    const user = userEvent.setup();
    render(<EditPatientDetailsButton patientId={12} />);
    // When - the modal is opened
    await user.click(
      screen.getByRole("button", { name: "Edit Patient Details" }),
    );
    // Then - a not found message shows
    expect(screen.getByText("Patient not found")).toBeInTheDocument();
  });

  it("closes and calls onSaved after a save", async () => {
    // Given - the modal is open
    const onSaved = vi.fn();
    const user = userEvent.setup();
    render(<EditPatientDetailsButton patientId={12} onSaved={onSaved} />);
    await user.click(
      screen.getByRole("button", { name: "Edit Patient Details" }),
    );
    // When - the patient is saved
    // The modal opens on the next animation frame, so wait for it.
    await user.click(await screen.findByRole("button", { name: "Mock save" }));
    // Then - onSaved runs and the modal closes
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Editing Alice Tan")).not.toBeInTheDocument();
  });
});
