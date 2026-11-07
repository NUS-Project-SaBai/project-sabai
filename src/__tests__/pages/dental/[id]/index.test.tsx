import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/router";
import PatientDentalPage from "@/pages/dental/[id]";
import { formatVisitDate } from "@/lib/utils/visit";
import { trpc } from "@/utils/trpc";

vi.mock("next/router", () => ({ useRouter: vi.fn() }));
vi.mock("@/components/layouts/withDefaultLayout", () => ({
  default: (page: React.ReactNode) => page,
}));
vi.mock("@/components/layouts/PatientTopMenuLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/utils/trpc", () => ({
  trpc: {
    patientsRouter: { getById: { useQuery: vi.fn() } },
    visitsRouter: { getByPatientId: { useQuery: vi.fn() } },
  },
}));

const router = vi.mocked(useRouter);
const patientQuery = vi.mocked(trpc.patientsRouter.getById.useQuery);
const visitsQuery = vi.mocked(trpc.visitsRouter.getByPatientId.useQuery);
const latest = { id: 20, date: new Date("2025-06-15T10:30:00") };
const older = { id: 10, date: new Date("2024-06-15T10:30:00") };

beforeEach(() => {
  vi.clearAllMocks();
  router.mockReturnValue({
    query: { id: "1" },
    isReady: true,
  } as unknown as ReturnType<typeof useRouter>);
  patientQuery.mockReturnValue({
    data: { id: 1, name: "John Doe" },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof patientQuery>);
  visitsQuery.mockReturnValue({
    data: [latest, older],
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof visitsQuery>);
});

test("selects the newest visit and preserves a manual choice on refetch, then resets for a different patient", async () => {
  const user = userEvent.setup();
  const { rerender } = render(<PatientDentalPage />);
  const latestDate = formatVisitDate(latest.date);
  const olderDate = formatVisitDate(older.date);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: latestDate }),
    ).toBeInTheDocument(),
  );
  await user.click(screen.getByRole("button", { name: latestDate }));
  await user.click(screen.getByRole("button", { name: olderDate }));
  expect(screen.getByRole("button", { name: olderDate })).toBeInTheDocument();

  visitsQuery.mockReturnValue({
    data: [{ ...latest }, { ...older }],
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof visitsQuery>);
  rerender(<PatientDentalPage />);
  expect(screen.getByRole("button", { name: olderDate })).toBeInTheDocument();

  router.mockReturnValue({
    query: { id: "2" },
    isReady: true,
  } as unknown as ReturnType<typeof useRouter>);
  patientQuery.mockReturnValue({
    data: { id: 2, name: "Jane Doe" },
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof patientQuery>);
  rerender(<PatientDentalPage />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: latestDate }),
    ).toBeInTheDocument(),
  );
  expect(screen.getByRole("heading", { name: /Jane Doe/ })).toBeInTheDocument();
});

test("shows the no-visits state", () => {
  visitsQuery.mockReturnValue({
    data: [],
    isLoading: false,
    isError: false,
  } as unknown as ReturnType<typeof visitsQuery>);
  render(<PatientDentalPage />);
  expect(
    screen.getByText(/No visits found for this patient/),
  ).toBeInTheDocument();
});

test("passes the numeric URL ID to both queries", () => {
  render(<PatientDentalPage />);
  expect(patientQuery).toHaveBeenCalledWith({ id: 1 }, { enabled: true });
  expect(visitsQuery).toHaveBeenCalledWith({ patientId: 1 }, { enabled: true });
});

test("shows an error when a patient query fails", () => {
  patientQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: true,
  } as unknown as ReturnType<typeof patientQuery>);
  render(<PatientDentalPage />);
  expect(
    screen.getByText(/Unable to load patient and visits/),
  ).toBeInTheDocument();
});
