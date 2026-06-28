import PatientVitalsPage from "@/pages/vitals/[id]";
import { trpc } from "@/utils/trpc";
import { Toaster, toast } from "react-hot-toast";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { assertLoadingSpinner } from "@/__tests__/utils/helper-functions";
import { useRouter } from "next/router";

vi.mock("next/router", () => ({
  useRouter: vi.fn(),
}));

vi.mock("@/components/layouts/withDefaultLayout", () => ({
  default: (page: React.ReactNode) => page,
}));

vi.mock("@/components/layouts/PatientTopMenuLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/utils/trpc", () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      vitalsRouter: {
        getByVisitId: { invalidate: vi.fn() },
      },
    })),
    patientsRouter: {
      getById: { useQuery: vi.fn() },
    },
    visitsRouter: {
      getByPatientId: { useQuery: vi.fn() },
    },
    vitalsRouter: {
      getByVisitId: { useQuery: vi.fn() },
      create: { useMutation: vi.fn() },
      updateByVisitId: { useMutation: vi.fn() },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTrpc = trpc as any;
const mockUseRouter = useRouter as ReturnType<typeof vi.fn>;

const MOCK_PATIENT = { id: 1, name: "John Doe" };

// Single visit to trigger the auto-select useEffect, so VitalsForm render without needing dropdown interaction
const MOCK_VISITS = [
  { id: 10, date: new Date("2024-06-15T10:30:00"), patientId: 1 },
];
const MOCK_VITALS = {
  visitId: 10,
  height: "170",
  weight: "65",
  temperature: "37.0",
  systolic: 120,
  diastolic: 80,
  heartRate: 72,
  hemocueCount: "14",
  diabetesMellitus: true,
  urineTest: "Clear",
  bloodGlucoseNonFasting: "5.5",
  bloodGlucoseFasting: "4.8",
  hba1c: "5.2",
  others: "No issues",
};

function renderPage() {
  return render(
    <>
      <Toaster />
      <PatientVitalsPage />
    </>,
  );
}

describe("VitalsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toast.dismissAll();

    mockUseRouter.mockReturnValue({ query: { id: "1" }, isReady: true });

    // Set up patient and a single visit so VitalsForm auto-renders
    mockTrpc.patientsRouter.getById.useQuery.mockReturnValue({
      data: MOCK_PATIENT,
      isLoading: false,
    });
    mockTrpc.visitsRouter.getByPatientId.useQuery.mockReturnValue({
      data: MOCK_VISITS,
      isLoading: false,
    });

    mockTrpc.vitalsRouter.create.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockTrpc.vitalsRouter.updateByVisitId.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  test("renders loading spinner while vitals data is loading", async () => {
    mockTrpc.vitalsRouter.getByVisitId.useQuery.mockReturnValue({
      data: null,
      isLoading: true,
    });

    renderPage();

    await waitFor(() => {
      assertLoadingSpinner("Loading Vitals");
    });
  });

  test("renders all form fields when no existing vitals", async () => {
    mockTrpc.vitalsRouter.getByVisitId.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Height (cm)")).toBeInTheDocument();
      expect(screen.getByText("Weight (kg)")).toBeInTheDocument();
      expect(screen.getByText("Body Temperature (°C)")).toBeInTheDocument();
      expect(screen.getByText("Heart Rate (BPM)")).toBeInTheDocument();
      expect(
        screen.getByText("Diabetes Mellitus History Status Flag"),
      ).toBeInTheDocument();
      expect(screen.getByText("Save Records")).toBeInTheDocument();
    });
  });

  test("pre-fills form with existing vitals data", async () => {
    mockTrpc.vitalsRouter.getByVisitId.useQuery.mockReturnValue({
      data: MOCK_VITALS,
      isLoading: false,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue(MOCK_VITALS.height)).toBeInTheDocument();
      expect(screen.getByDisplayValue(MOCK_VITALS.weight)).toBeInTheDocument();
      expect(
        screen.getByDisplayValue(MOCK_VITALS.temperature),
      ).toBeInTheDocument();
    });
  });

  test("shows success toast when vitals are saved", async () => {
    const user = userEvent.setup();
    mockTrpc.vitalsRouter.getByVisitId.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });
    // useMutation receives onSuccess at setup time, so capture it via mockImplementation
    mockTrpc.vitalsRouter.create.useMutation.mockImplementation(
      ({ onSuccess }: { onSuccess: () => void }) => ({
        mutate: vi.fn(() => onSuccess()),
        isPending: false,
      }),
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Height (cm)")).toBeInTheDocument();
    });

    // Dirty the form so isDirty guard doesn't block submission, value here to be different from what is in MOCK_VITALS
    await user.type(screen.getByLabelText("Height (cm)"), "171");
    await user.click(screen.getByText("Save Records"));

    await waitFor(() => {
      expect(
        screen.getByText("Vitals saved successfully!"),
      ).toBeInTheDocument();
    });
  });

  test("shows info toast when submitting without changing any field", async () => {
    const user = userEvent.setup();
    mockTrpc.vitalsRouter.getByVisitId.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText("Save Records")).toBeInTheDocument();
    });

    await user.click(screen.getByText("Save Records"));

    await waitFor(() => {
      expect(screen.getByText("No form field changed!")).toBeInTheDocument();
    });
  });
});
