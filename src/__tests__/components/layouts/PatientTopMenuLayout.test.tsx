import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import { trpc } from "@/utils/trpc";
import type { PatientsRouterListWithLatestVisitItem } from "@/utils/trpc-types";

vi.mock("@/utils/trpc", () => ({
  trpc: { patientsRouter: { listWithLatestVisit: { useQuery: vi.fn() } } },
}));

const patient: PatientsRouterListWithLatestVisitItem = {
  id: 1,
  name: "Somchai Phuket",
  identificationNumber: "AB123456",
  contactNo: null,
  gender: "male",
  dateOfBirth: new Date("1990-01-01"),
  drugAllergy: "",
  hasPoorCard: false,
  hasBS2Card: false,
  hasSabaiCard: false,
  patientImagePublicId: "",
  patientImageUrl: null,
  rekognitionFaceId: null,
  villageCode: "PC",
  villageColorHex: "#ff0000",
};

function searchFor(query: string) {
  fireEvent.change(screen.getByPlaceholderText("Search patients..."), {
    target: { value: query },
  });
  act(() => vi.advanceTimersByTime(300));
}

function mockPatientsResult(
  overrides: Partial<
    ReturnType<typeof trpc.patientsRouter.listWithLatestVisit.useQuery>
  > = {},
) {
  vi.mocked(trpc.patientsRouter.listWithLatestVisit.useQuery).mockReturnValue({
    data: [patient],
    isLoading: false,
    isRefetching: false,
    isError: false,
    ...overrides,
  } as ReturnType<typeof trpc.patientsRouter.listWithLatestVisit.useQuery>);
}

describe("PatientTopMenuLayout search", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockPatientsResult();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("shows fuzzy results after debouncing and preserves custom result links", () => {
    render(
      <PatientTopMenuLayout getPatientLink={(id) => `/vitals/${id}`}>
        <p>Page content</p>
      </PatientTopMenuLayout>,
    );
    expect(screen.queryByText(patient.name)).not.toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Search patients..."), {
      target: { value: "Somchaj" },
    });
    act(() => vi.advanceTimersByTime(299));
    expect(screen.queryByText(patient.name)).not.toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(
      screen.getByRole("link", { name: /Somchai Phuket/ }),
    ).toHaveAttribute("href", "/vitals/1");
    expect(screen.getByText("PC0001")).toBeInTheDocument();

    fireEvent.keyDown(screen.getByPlaceholderText("Search patients..."), {
      key: "Escape",
    });
    act(() => vi.advanceTimersByTime(300));
    expect(screen.queryByText(patient.name)).not.toBeInTheDocument();
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("updates results for the current query when patients are loaded, changed or removed", () => {
    mockPatientsResult({
      data: undefined,
      isLoading: true,
      isRefetching: false,
    });
    const { rerender } = render(
      <PatientTopMenuLayout>Page content</PatientTopMenuLayout>,
    );
    searchFor("Somchaj");
    expect(screen.getByText("Loading patients...")).toBeInTheDocument();

    mockPatientsResult({
      data: [patient],
      isLoading: false,
      isRefetching: false,
    });
    rerender(<PatientTopMenuLayout>Page content</PatientTopMenuLayout>);
    expect(screen.getByText(patient.name)).toBeInTheDocument();

    mockPatientsResult({
      data: [{ ...patient, name: "Nok" }],
      isLoading: false,
      isRefetching: false,
    });
    rerender(<PatientTopMenuLayout>Page content</PatientTopMenuLayout>);
    expect(screen.queryByText(patient.name)).not.toBeInTheDocument();
    expect(screen.getByText("No matching patients found.")).toBeInTheDocument();

    searchFor("PC0002");
    expect(screen.getByText("Nok")).toBeInTheDocument();
    mockPatientsResult({
      data: [],
      isLoading: false,
      isRefetching: false,
    });
    rerender(<PatientTopMenuLayout>Page content</PatientTopMenuLayout>);
    expect(screen.queryByText("Nok")).not.toBeInTheDocument();
    expect(screen.getByText("No matching patients found.")).toBeInTheDocument();
  });

  it("shows an exact code before fuzzy alternatives without duplicate rows", () => {
    mockPatientsResult({
      data: [patient, { ...patient, id: 2, name: "Nok" }],
      isLoading: false,
      isRefetching: false,
    });
    render(<PatientTopMenuLayout>Page content</PatientTopMenuLayout>);
    searchFor("PC0002");
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/patient/2");
    expect(links[1]).toHaveAttribute("href", "/patient/1");
  });

  it("finds an unpadded code while displaying the padded code and original link", () => {
    mockPatientsResult({
      data: [patient, { ...patient, id: 12, name: "Nok" }],
      isLoading: false,
      isRefetching: false,
    });
    render(<PatientTopMenuLayout>Page content</PatientTopMenuLayout>);
    searchFor("pc1");
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/patient/1");
    expect(links[0]).toHaveTextContent("PC0001");
    expect(links[1]).toHaveTextContent("PC0012");
  });

  it("lists an exact village after name matches and refreshes village membership", () => {
    const nameMatch = { ...patient, id: 2, name: "PCA", villageCode: "CA" };
    const unrelated = { ...patient, id: 3, name: "Nok", villageCode: "PCA" };
    mockPatientsResult({
      data: [patient, nameMatch, unrelated],
      isLoading: false,
      isRefetching: false,
    });
    const { rerender } = render(
      <PatientTopMenuLayout>Page content</PatientTopMenuLayout>,
    );
    searchFor("pc");
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/patient/2");
    expect(links[1]).toHaveAttribute("href", "/patient/1");
    expect(links[1]).toHaveTextContent("PC0001");

    mockPatientsResult({
      data: [{ ...patient, villageCode: "CA" }, nameMatch, unrelated],
      isLoading: false,
      isRefetching: false,
    });
    rerender(<PatientTopMenuLayout>Page content</PatientTopMenuLayout>);
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.queryByText(patient.name)).not.toBeInTheDocument();
  });

  it("distinguishes a failed query from an empty search", () => {
    mockPatientsResult({ data: undefined, isError: true });
    render(<PatientTopMenuLayout>Page content</PatientTopMenuLayout>);
    searchFor("PC1");
    expect(
      screen.getByText("Unable to load patients. Please try again."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No matching patients found."),
    ).not.toBeInTheDocument();
  });
});
