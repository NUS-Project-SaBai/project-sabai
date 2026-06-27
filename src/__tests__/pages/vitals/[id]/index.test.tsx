import PatientVitalsPage from "@/pages/vitals/[id]";
import { vitalsRouter } from "@/server/routers/vitals_router";
import { trpc } from "@/utils/trpc";
import { Toaster, toast } from "react-hot-toast";

// Mock tRPC
vi.mock("@/utils/trpc", () => ({
  trpc: {
    useUtils: vi.fn(() => ({
      vitalsRouter: {
        list: {
          invalidate: vi.fn(),
        },
      },
    })),
    vitalsRouter: {
      getByVisitId: {
        useQuery: vi.fn(),
      },
      createVitalsMutation: {
        useMutation: vi.fn(),
      },
      updateVitalsMutation: {
        useMutation: vi.fn(),
      },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTrpc = trpc as any;

describe("PatientVitalsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toast.dismissAll();
  });
});
