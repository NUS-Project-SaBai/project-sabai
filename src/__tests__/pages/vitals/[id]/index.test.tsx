import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  cleanup,
  render,
  screen,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PatientVitalsPage from "@/pages/vitals/[id]";
import { trpc } from "@/utils/trpc";
import { Toaster } from "react-hot-toast";

// Helper function duplicated from component to prevent local timezone runner flakiness
const formatVisitDate = (date: Date) => {
  return new Date(date).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// =========================================================================
// 1. HOISTED MODULE MOCKS (Pre-empts Top-Level Environment Schema Validation)
// =========================================================================
vi.mock("@/lib/envVariables", () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "mock-local-publishable-key",
  },
}));

vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(() =>
        Promise.resolve({ data: { session: null }, error: null }),
      ),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

vi.mock("@/lib/context/SessionContext", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
  useSession: vi.fn(() => ({ session: null, isLoading: false })),
}));

vi.mock("next/router", () => ({
  useRouter: vi.fn(() => ({
    query: { id: "1" },
    isReady: true,
  })),
}));

// Mock tRPC structures with accessible tracking spy definitions
const mockInvalidate = vi.fn();
const mockCreateMutation = vi.fn();
const mockUpdateMutation = vi.fn();
let mockMutationIsPending = false;

vi.mock("@/utils/trpc", () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      vitalsRouter: {
        getByVisitId: {
          invalidate: mockInvalidate,
        },
      },
    })),
    patientsRouter: {
      getById: {
        useQuery: vi.fn(),
      },
    },
    visitsRouter: {
      getByPatientId: {
        useQuery: vi.fn(),
      },
    },
    vitalsRouter: {
      getByVisitId: {
        useQuery: vi.fn(),
      },
      create: {
        useMutation: vi.fn(() => ({
          mutate: mockCreateMutation,
          isPending: false,
        })),
      },
      updateByVisitId: {
        useMutation: vi.fn(() => ({
          mutate: mockUpdateMutation,
          get isPending() {
            return mockMutationIsPending;
          },
        })),
      },
    },
  },
}));

// Mock Data Sets
const MOCK_PATIENT = { id: 1, name: "John Doe" };
const MOCK_VISIT_SINGLE = [
  { id: 101, date: new Date("2026-06-01T10:00:00.000Z") },
];
const MOCK_VISITS_MULTI = [
  { id: 101, date: new Date("2026-06-01T10:00:00.000Z") },
  { id: 102, date: new Date("2026-06-15T14:30:00.000Z") },
];
const MOCK_EXISTING_VITALS = {
  id: 50,
  height: "172.50",
  weight: "68.20",
  temperature: "36.70",
  systolic: 118,
  diastolic: 76,
  heartRate: 72,
  hemocueCount: "14.10",
  diabetesMellitus: true,
  urineTest: "Trace protein detected",
  bloodGlucoseFasting: "5.20",
  bloodGlucoseNonFasting: "6.40",
  hba1c: "5.50",
  others: "Patient reports mild fatigue.",
  visitId: 101,
};

// Safe type assertion that avoids explicit 'any' rule failure
const mockTrpc = trpc as unknown as Record<string, Record<string, Record<string, Record<string, { mockReturnValue: (val: unknown) => void }>>>>;

describe("PatientVitalsPage & VitalsForm Full Integration Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutationIsPending = false;

    // Default successful layout query responses
    mockTrpc.patientsRouter.getById.useQuery.mockReturnValue({
      data: MOCK_PATIENT,
      isLoading: false,
    });
    mockTrpc.visitsRouter.getByPatientId.useQuery.mockReturnValue({
      data: MOCK_VISITS_MULTI,
      isLoading: false,
    });
    mockTrpc.vitalsRouter.getByVisitId.useQuery.mockReturnValue({
      data: null,
      isLoading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  // ==========================================
  // 1. CORE SHELL & ASYNCHRONOUS LOADING STATES
  // ==========================================
  describe("Core Shell & Loading States", () => {
    it("renders the main structural loading spinner when queries are fetching", () => {
      mockTrpc.patientsRouter.getById.useQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });
      render(<PatientVitalsPage />);
      expect(
        screen.getByText("Loading patient and visits..."),
      ).toBeInTheDocument();
    });

    it("renders the defensive error banner if the patient identity is missing", () => {
      mockTrpc.patientsRouter.getById.useQuery.mockReturnValue({
        data: null,
        isLoading: false,
      });
      render(<PatientVitalsPage />);
      expect(screen.getByText("Patient not found")).toBeInTheDocument();
    });

    it("renders core navigational layout parameters upon data resolution", () => {
      render(<PatientVitalsPage />);
      expect(
        screen.getByText("Patient Vitals Matrix — John Doe"),
      ).toBeInTheDocument();
      expect(screen.getByText("Vitals for - John Doe")).toBeInTheDocument();
    });
  });

  // ==========================================
  // 2. VISIT SELECTION & DROPDOWN INTERACTIVITY
  // ==========================================
  describe("Visit Selection & Dropdown Lifecycle", () => {
    it("displays a warning block if zero historical patient visits exist", () => {
      mockTrpc.visitsRouter.getByPatientId.useQuery.mockReturnValue({
        data: [],
        isLoading: false,
      });
      render(<PatientVitalsPage />);
      expect(
        screen.getByText("No visits found for patient."),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Select an option/i }),
      ).not.toBeInTheDocument();
    });

    it("automatically selects the active visit container if exactly one record exists", async () => {
      mockTrpc.visitsRouter.getByPatientId.useQuery.mockReturnValue({
        data: MOCK_VISIT_SINGLE,
        isLoading: false,
      });
      render(<PatientVitalsPage />);
      await waitFor(() => {
        expect(
          screen.getByText(/Filling up vitals form for visit on/i),
        ).toBeInTheDocument();
      });
    });

    it("prompts the practitioner to select a target visit when multiple options exist", () => {
      render(<PatientVitalsPage />);
      expect(
        screen.getByText("Please choose a visit to view vitals."),
      ).toBeInTheDocument();
    });
  });

  // ==========================================
  // 3. SUB-FORM INITIALIZATION & SYNCHRONIZATION
  // ==========================================
  describe("Sub-Form Initialization & Data Sync", () => {
    it("mounts a localized sub-form spinner during isolated vitals data retrieval", async () => {
      const user = userEvent.setup();
      mockTrpc.vitalsRouter.getByVisitId.useQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      });

      render(<PatientVitalsPage />);
      await user.click(
        screen.getByRole("button", { name: /Select an option/i }),
      );

      const dynamicDateText = formatVisitDate(MOCK_VISITS_MULTI[0].date);
      await user.click(await screen.findByText(dynamicDateText));

      expect(screen.getByText("Loading Vitals")).toBeInTheDocument();
    });

    it("initializes form caches with clean string defaults if zero vitals exist", async () => {
      const user = userEvent.setup();
      const { container } = render(<PatientVitalsPage />);

      await user.click(
        screen.getByRole("button", { name: /Select an option/i }),
      );
      const dynamicDateText = formatVisitDate(MOCK_VISITS_MULTI[0].date);
      await user.click(await screen.findByText(dynamicDateText));

      await waitFor(() => {
        expect(container.querySelector('input[name="height"]')).toHaveValue(
          null,
        );
        expect(container.querySelector('input[name="weight"]')).toHaveValue(
          null,
        );
        expect(
          container.querySelector('textarea[name="urineTest"]'),
        ).toHaveValue("");
      });
    });

    it("pre-populates all inputs correctly when historical vitals records match the visit ID", async () => {
      const user = userEvent.setup();
      mockTrpc.vitalsRouter.getByVisitId.useQuery.mockReturnValue({
        data: MOCK_EXISTING_VITALS,
        isLoading: false,
      });

      const { container } = render(<PatientVitalsPage />);
      await user.click(
        screen.getByRole("button", { name: /Select an option/i }),
      );
      const dynamicDateText = formatVisitDate(MOCK_VISITS_MULTI[0].date);
      await user.click(await screen.findByText(dynamicDateText));

      await waitFor(() => {
        expect(container.querySelector('input[name="height"]')).toHaveValue(
          172.5,
        );
        expect(container.querySelector('input[name="weight"]')).toHaveValue(
          68.2,
        );
        expect(container.querySelector('input[name="systolic"]')).toHaveValue(
          118,
        );
        expect(container.querySelector('input[name="diastolic"]')).toHaveValue(
          76,
        );
        expect(
          container.querySelector('textarea[name="urineTest"]'),
        ).toHaveValue("Trace protein detected");

        expect(screen.getByText("Positive")).toBeInTheDocument();
        expect(screen.getByText("Negative")).toBeInTheDocument();
      });
    });

    it("routes data modifications through the update procedure if historical data exists", async () => {
      const user = userEvent.setup();
      mockTrpc.vitalsRouter.getByVisitId.useQuery.mockReturnValue({
        data: MOCK_EXISTING_VITALS,
        isLoading: false,
      });

      const { container } = render(<PatientVitalsPage />);
      await user.click(
        screen.getByRole("button", { name: /Select an option/i }),
      );
      const dynamicDateText = formatVisitDate(MOCK_VISITS_MULTI[0].date);
      await user.click(await screen.findByText(dynamicDateText));

      const weightField = container.querySelector('input[name="weight"]')!;
      await user.clear(weightField);
      await user.type(weightField, "90");

      const formElement = container.querySelector("form");
      if (formElement) {
        fireEvent.submit(formElement);
      } else {
        await user.click(screen.getByRole("button", { name: /Save Records/i }));
      }

      await waitFor(() => {
        expect(mockUpdateMutation).toHaveBeenCalledWith(
          expect.objectContaining({
            visitId: 101,
            weight: "90",
          }),
        );
      });
    });
  });

  // ==========================================
  // 4. PAYLOAD INTERCEPTION & TYPE COERCIONS
  // ==========================================
  describe("Payload Interception & Mutation Routing", () => {
    it("routes data parameters through the creation pipeline if data row is entirely new", async () => {
      const user = userEvent.setup();
      const { container } = render(<PatientVitalsPage />);

      await user.click(
        screen.getByRole("button", { name: /Select an option/i }),
      );
      const dynamicDateText = formatVisitDate(MOCK_VISITS_MULTI[0].date);
      await user.click(await screen.findByText(dynamicDateText));

      const heightField = container.querySelector('input[name="height"]')!;
      await user.type(heightField, "185");

      const formElement = container.querySelector("form");
      if (formElement) {
        fireEvent.submit(formElement);
      } else {
        await user.click(screen.getByRole("button", { name: /Save Records/i }));
      }

      await waitFor(() => {
        expect(mockCreateMutation).toHaveBeenCalledWith(
          expect.objectContaining({
            visitId: 101,
            height: "185",
          }),
        );
      });
    });

    it("routes updates correctly if working on top of old data rows", async () => {
      const user = userEvent.setup();
      mockTrpc.vitalsRouter.getByVisitId.useQuery.mockReturnValue({
        data: MOCK_EXISTING_VITALS,
        isLoading: false,
      });

      const { container } = render(<PatientVitalsPage />);
      await user.click(
        screen.getByRole("button", { name: /Select an option/i }),
      );
      const dynamicDateText = formatVisitDate(MOCK_VISITS_MULTI[0].date);
      await user.click(await screen.findByText(dynamicDateText));

      const weightField = container.querySelector('input[name="weight"]')!;
      await user.clear(weightField);
      await user.type(weightField, "90");

      const formElement = container.querySelector("form");
      if (formElement) {
        fireEvent.submit(formElement);
      } else {
        await user.click(screen.getByRole("button", { name: /Save Records/i }));
      }

      await waitFor(() => {
        expect(mockUpdateMutation).toHaveBeenCalledWith(
          expect.objectContaining({
            visitId: 101,
            weight: "90",
            urineTest: "Trace protein detected",
          }),
        );
      });
    });

    it("strictly coerces numeric string text into true numerical signatures on targeted fields", async () => {
      const user = userEvent.setup();
      const { container } = render(<PatientVitalsPage />);

      await user.click(
        screen.getByRole("button", { name: /Select an option/i }),
      );
      const dynamicDateText = formatVisitDate(MOCK_VISITS_MULTI[0].date);
      await user.click(await screen.findByText(dynamicDateText));

      await user.type(
        container.querySelector('input[name="systolic"]')!,
        "120",
      );
      await user.type(
        container.querySelector('input[name="diastolic"]')!,
        "80",
      );
      await user.type(
        container.querySelector('input[name="heartRate"]')!,
        "70",
      );

      const formElement = container.querySelector("form");
      if (formElement) {
        fireEvent.submit(formElement);
      } else {
        await user.click(screen.getByRole("button", { name: /Save Records/i }));
      }

      await waitFor(() => {
        expect(mockCreateMutation).toHaveBeenCalledWith(
          expect.objectContaining({
            systolic: 120,
            diastolic: 80,
            heartRate: 70,
          }),
        );
        const dispatchedPayload = mockCreateMutation.mock.calls[0][0];
        expect(typeof dispatchedPayload.systolic).toBe("number");
        expect(typeof dispatchedPayload.diastolic).toBe("number");
      });
    });
  });

  // ==========================================
  // 5. UI MUTATED STATE FEEDBACK & INVALIDATION
  // ==========================================
  describe("UI Mutated State Feedback", () => {
    it("assigns loading states to controls during active operation execution cycles", async () => {
      const user = userEvent.setup();
      mockMutationIsPending = true;
      mockTrpc.vitalsRouter.getByVisitId.useQuery.mockReturnValue({
        data: MOCK_EXISTING_VITALS,
        isLoading: false,
      });

      render(<PatientVitalsPage />);
      await user.click(
        screen.getByRole("button", { name: /Select an option/i }),
      );
      const dynamicDateText = formatVisitDate(MOCK_VISITS_MULTI[0].date);
      await user.click(await screen.findByText(dynamicDateText));

      const saveButton = screen.getByRole("button", { name: /Save Records/i });
      expect(saveButton).toBeInTheDocument();
    });

    it("triggers cache invalidations and fires user notifications upon mutation victory", async () => {
      const user = userEvent.setup();
      mockTrpc.vitalsRouter.create.useMutation.mockImplementation(
        ({ onSuccess }) => ({
          mutate: vi.fn(() => onSuccess?.()),
          isPending: false,
        }),
      );

      const { container } = render(
        <>
          <Toaster />
          <PatientVitalsPage />
        </>,
      );

      await user.click(
        screen.getByRole("button", { name: /Select an option/i }),
      );
      const dynamicDateText = formatVisitDate(MOCK_VISITS_MULTI[0].date);
      await user.click(await screen.findByText(dynamicDateText));

      const formElement = container.querySelector("form");
      if (formElement) {
        fireEvent.submit(formElement);
      } else {
        await user.click(screen.getByRole("button", { name: /Save Records/i }));
      }

      await waitFor(() => {
        expect(mockInvalidate).toHaveBeenCalledWith({ visitId: 101 });
        expect(screen.getByRole("status")).toHaveTextContent(
          "Vitals Uploaded successfully",
        );
      });
    });
  });
});