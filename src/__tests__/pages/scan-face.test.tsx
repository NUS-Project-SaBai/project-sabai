import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MedicationActiveIngredientsBasePage from "@/pages/medication-active-ingredients";
import { trpc } from "@/utils/trpc";
import {
  assertBreadcrumbs,
  assertLoadingSpinner,
  assertTableContents,
} from "@/__tests__/utils/helper-functions";
import { Toaster, toast } from "react-hot-toast";

// Mock tRPC
vi.mock("@/utils/trpc", () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      // TODO: to check on the invalidation here
      patientsRouter: {
        list: {
          invalidate: vi.fn(),
        },
      },
    })),
    patientsRouter: {
      create: {
        useMutation: vi.fn(),
      },
      findFaceMatches: {
        useMutation: vi.fn(),
      },
      listMatchingPatients: {
        useMutation: vi.fn(),
      },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTrpc = trpc as any;

describe("ScanFacePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toast.dismissAll();

    mockTrpc.patientsRouter.create.useMutation.mockReturnValue({
      mutate: vi.fn(),
    });
    mockTrpc.patientsRouter.findFaceMatches.useMutation.mockReturnValue({
      mutate: vi.fn(),
    });
    mockTrpc.patientsRouter.listMatchingPatients.useMutation.mockReturnValue({
      mutate: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders page title", () => {});
  it("displays a webcam and a form in registration mode", () => {});
  it("displays an error if a village code is not selected while creating a patient", () => {});
  it("displays an error if the registration form's button is clicked while an image is not captured", () => {});
  it("", () => {});
  it("displays a message that there is no matching patients, and a button to register new patients if no matching patients", () => {});
  it("displays a loading spinner while loading the list of matching patients", () => {});
  it("displays a list of patients with high similarity score when face is scanned, if exists in database", () => {});
  it("disables the registration button and displays a loading spinner while registering patients", () => {});
});
