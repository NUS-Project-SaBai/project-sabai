import PatientPage from "@/pages/patient/[id]";
import { trpc } from "@/utils/trpc";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/router";


// Mock data 
vi.mock("next/router", () => ({   // returns id 
  useRouter: vi.fn(),
}));

vi.mock("@/components/layouts/withDefaultLayout", () => ({
  default: (page: React.ReactNode) => page,
}));

vi.mock("@/components/layouts/PatientTopMenuLayout", () => ({ 
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// The real skeleton has no text to query, so swap in a marker we can look for.
vi.mock("@/components/PatientDetailSkeleton", () => ({
  default: () => <div data-testid="patient-detail-skeleton" />,
}));


// tests only cover how this page opens and closes it. But does not test the logic of the ediut form 
vi.mock("@/components/patient/EditPatientForm", () => ({
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="edit-patient-form">
      <button onClick={onSuccess}>Mock successful save</button>
    </div>
  ),
}));

vi.mock("@/utils/trpc", () => ({
  trpc: {
    patientsRouter: {
      getById: { useQuery: vi.fn() },
    },
    visitsRouter: {
      getByPatientId: { useQuery: vi.fn() },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTrpc = trpc as any;
const mockUseRouter = useRouter as ReturnType<typeof vi.fn>;

const MOCK_PATIENT = {
  id: 1,
  name: "John Doe",
  identificationNumber: "ID001",
  contactNo: "08-1234-5678",
  gender: "male",
  dateOfBirth: new Date("1985-03-15"),
  drugAllergy: "Penicillin",
  hasPoorCard: true,
  hasBS2Card: false,
  hasSabaiCard: true,
  patientImageUrl: "https://example.com/patient-photo.jpg",
};

// Newest visit first, like the visits router returns them.
const MOCK_VISITS = [
  {
    id: 2,
    date: new Date("2024-07-01T09:00:00"),
    villageCodeName: "PC Village",
    villageCodeColor: "#ff0000",
  },
  {
    id: 1,
    date: new Date("2024-06-15T10:30:00"),
    villageCodeName: "Other Village",
    villageCodeColor: "#00ff00",
  },
];

// Each detail is rendered as <p>{label}</p><p>{value}</p>, so the value is the
// label's next sibling.
function detailValue(label: string) {
  return screen.getByText(label).nextElementSibling;
}

function mockPatientQuery(result: object) {
  mockTrpc.patientsRouter.getById.useQuery.mockReturnValue(result);
}

function mockVisitsQuery(result: object) {
  mockTrpc.visitsRouter.getByPatientId.useQuery.mockReturnValue(result);
}

describe("PatientPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseRouter.mockReturnValue({ query: { id: "1" }, isReady: true });
    mockPatientQuery({
      data: MOCK_PATIENT,
      isLoading: false,
      isRefetching: false,
    });
    mockVisitsQuery({ data: [], isLoading: false });
  });

  test("shows the loading skeleton while the patient is loading", () => {
    mockPatientQuery({ data: undefined, isLoading: true, isRefetching: false });

    render(<PatientPage />);

    expect(screen.getByTestId("patient-detail-skeleton")).toBeInTheDocument();
    expect(screen.queryByText("Patient not found")).not.toBeInTheDocument();
  });

  test("shows 'Patient not found' when the query returns no patient", () => {
    mockPatientQuery({
      data: undefined,
      isLoading: false,
      isRefetching: false,
    });

    render(<PatientPage />);

    expect(screen.getByText("Patient not found")).toBeInTheDocument();
    expect(screen.getByText("No patient exists for ID: 1")).toBeInTheDocument();
  });

  describe("patient details", () => {
    test("shows the patient's name and photo", () => {
      render(<PatientPage />);

      expect(
        screen.getByRole("heading", { name: "John Doe" }),
      ).toBeInTheDocument();
      expect(screen.getByAltText("Patient Photo")).toBeInTheDocument();
    });

    test("zero-pads the patient ID to 4 digits", () => {
      render(<PatientPage />);

      expect(detailValue("ID")).toHaveTextContent(/^0001$/);
    });

    test("capitalises the gender", () => {
      render(<PatientPage />);

      expect(detailValue("Gender")).toHaveTextContent(/^Male$/);
    });

    test("shows Yes or No for the POOR, BS2 and Sabai Card fields", () => {
      render(<PatientPage />);

      // MOCK_PATIENT: POOR card yes, BS2 card no, Sabai card yes
      expect(detailValue("POOR")).toHaveTextContent(/^Yes$/);
      expect(detailValue("BS2")).toHaveTextContent(/^No$/);
      expect(detailValue("Sabai Card")).toHaveTextContent(/^Yes$/);
    });

    test("shows No for every card when the patient has none", () => {
      mockPatientQuery({
        data: {
          ...MOCK_PATIENT,
          hasPoorCard: false,
          hasBS2Card: false,
          hasSabaiCard: false,
        },
        isLoading: false,
        isRefetching: false,
      });

      render(<PatientPage />);

      expect(detailValue("POOR")).toHaveTextContent(/^No$/);
      expect(detailValue("BS2")).toHaveTextContent(/^No$/);
      expect(detailValue("Sabai Card")).toHaveTextContent(/^No$/);
    });

    test("does not show the raw patient image URL", () => {
      render(<PatientPage />);

      expect(screen.queryByText("Patient Image URL")).not.toBeInTheDocument();
      expect(
        screen.queryByText(MOCK_PATIENT.patientImageUrl),
      ).not.toBeInTheDocument();
    });
  });

  describe("edit patient modal", () => {
    async function openEditModal() {
      const user = userEvent.setup();
      render(<PatientPage />);

      await user.click(
        screen.getByRole("button", { name: "Edit Patient Details" }),
      );

      // Modal calls showModal() inside requestAnimationFrame, so wait for it.
      const dialog = await screen.findByRole("dialog");
      return { user, dialog };
    }

    test("is closed until 'Edit Patient Details' is clicked", () => {
      render(<PatientPage />);

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.queryByTestId("edit-patient-form")).not.toBeInTheDocument();
    });

    test("opens the edit form when 'Edit Patient Details' is clicked", async () => {
      const { dialog } = await openEditModal();

      expect(
        within(dialog).getByRole("heading", { name: "Edit Patient Details" }),
      ).toBeInTheDocument();
      expect(within(dialog).getByTestId("edit-patient-form")).toBeVisible();
    });

    test("closes when the Close button is clicked", async () => {
      const { user, dialog } = await openEditModal();

      await user.click(within(dialog).getByRole("button", { name: "Close" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    test("closes after the form reports a successful save", async () => {
      const { user, dialog } = await openEditModal();

      await user.click(
        within(dialog).getByRole("button", { name: "Mock successful save" }),
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  describe("visit history", () => {
    test("shows a loading message while visits are loading", () => {
      mockVisitsQuery({ data: undefined, isLoading: true });

      render(<PatientPage />);

      expect(screen.getByText("Loading visits...")).toBeInTheDocument();
    });

    test("shows an empty message when the patient has no visits", () => {
      render(<PatientPage />);

      expect(
        screen.getByText("No visits recorded for this patient."),
      ).toBeInTheDocument();
    });

    test("lists each visit, numbered from oldest to newest", () => {
      mockVisitsQuery({ data: MOCK_VISITS, isLoading: false });

      render(<PatientPage />);

      // Visits are listed newest first, but numbered oldest = #1.
      expect(screen.getByText("Visit #2")).toBeInTheDocument();
      expect(screen.getByText("Visit #1")).toBeInTheDocument();
      expect(screen.getByText("PC Village")).toBeInTheDocument();
      expect(screen.getByText("Other Village")).toBeInTheDocument();
    });
  });
});
