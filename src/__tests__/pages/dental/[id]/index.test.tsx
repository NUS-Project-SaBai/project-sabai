import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/router";
import { Toaster, toast } from "react-hot-toast";
import type { Dental } from "@/db/schema/dental";
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
    useUtils: vi.fn(),
    patientsRouter: { getById: { useQuery: vi.fn() } },
    visitsRouter: { getByPatientId: { useQuery: vi.fn() } },
    dentalRouter: {
      getByVisitId: { useQuery: vi.fn() },
      create: { useMutation: vi.fn() },
      update: { useMutation: vi.fn() },
    },
  },
}));

const router = vi.mocked(useRouter);
const patientQuery = vi.mocked(trpc.patientsRouter.getById.useQuery);
const visitsQuery = vi.mocked(trpc.visitsRouter.getByPatientId.useQuery);
const dentalQuery = vi.mocked(trpc.dentalRouter.getByVisitId.useQuery);
const createMutation = vi.mocked(trpc.dentalRouter.create.useMutation);
const updateMutation = vi.mocked(trpc.dentalRouter.update.useMutation);
const latest = { id: 20, date: new Date("2025-06-15T10:30:00") };
const older = { id: 10, date: new Date("2024-06-15T10:30:00") };

/** A saved dental row; columns the form doesn't read are left out. */
const dentalRecord = (fields: Partial<Dental>) => fields as Dental;

// Saved records per visit id; a missing entry means no record yet.
let savedRecords: Record<number, Dental> = {};
const createMutate = vi.fn();
const updateMutate = vi.fn();
const setData = vi.fn();
type MutationOptions = { onSuccess: (saved: Dental) => void };
let createOptions: MutationOptions;

beforeEach(() => {
  vi.clearAllMocks();
  toast.remove();
  savedRecords = {};
  vi.mocked(trpc.useUtils).mockReturnValue({
    dentalRouter: { getByVisitId: { setData } },
  } as unknown as ReturnType<typeof trpc.useUtils>);
  dentalQuery.mockImplementation(
    (input) =>
      ({
        data: savedRecords[(input as { visitId: number }).visitId] ?? null,
        isLoading: false,
        isError: false,
      }) as unknown as ReturnType<typeof dentalQuery>,
  );
  createMutation.mockImplementation((options) => {
    createOptions = options as unknown as MutationOptions;
    return { mutate: createMutate, isPending: false } as unknown as ReturnType<
      typeof createMutation
    >;
  });
  updateMutation.mockReturnValue({
    mutate: updateMutate,
    isPending: false,
  } as unknown as ReturnType<typeof updateMutation>);
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

test("shows a loading message while the router is not ready", () => {
  router.mockReturnValue({
    query: {},
    isReady: false,
  } as unknown as ReturnType<typeof useRouter>);

  render(<PatientDentalPage />);

  expect(screen.getByText("Loading patient and visits...")).toBeInTheDocument();
  expect(patientQuery).not.toHaveBeenCalled();
  expect(visitsQuery).not.toHaveBeenCalled();
});

test("shows a loading message while patient data is loading", () => {
  patientQuery.mockReturnValue({
    data: undefined,
    isLoading: true,
    isError: false,
  } as unknown as ReturnType<typeof patientQuery>);

  render(<PatientDentalPage />);

  expect(screen.getByText("Loading patient and visits...")).toBeInTheDocument();
});

test("shows a loading message while visits data is loading", () => {
  visitsQuery.mockReturnValue({
    data: undefined,
    isLoading: true,
    isError: false,
  } as unknown as ReturnType<typeof visitsQuery>);

  render(<PatientDentalPage />);

  expect(screen.getByText("Loading patient and visits...")).toBeInTheDocument();
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
  expect(
    screen.queryByRole("heading", { name: "Dental History" }),
  ).not.toBeInTheDocument();
});

test("renders every dental history question with its options", () => {
  render(<PatientDentalPage />);
  expect(
    screen.getByRole("heading", { name: "Dental History" }),
  ).toBeInTheDocument();

  const expected: Record<string, string[]> = {
    "Previous dental visit": ["Yes", "No", "Unknown"],
    "Previous dental treatment": ["Yes", "No", "Unknown"],
    Toothache: ["Yes", "No"],
    Extraction: ["Yes", "No"],
    "Dental trauma": ["Yes", "No"],
    "Current toothache": ["Yes", "No"],
    "Tooth sensitivity": ["Yes", "No"],
    "Bleeding gums": ["Yes", "No"],
    "Brushing frequency": [
      "Once",
      "Twice",
      "3+ times",
      "Occasionally",
      "Never",
    ],
    "Fluoride toothpaste": ["Yes", "No", "Unknown"],
    "Sugar consumption": ["Low", "Moderate", "High"],
  };
  for (const [question, options] of Object.entries(expected)) {
    const group = screen.getByRole("radiogroup", { name: question });
    const radios = within(group).getAllByRole("radio");
    expect(radios.map((radio) => radio.textContent)).toEqual(options);
    radios.forEach((radio) =>
      expect(radio).toHaveAttribute("aria-checked", "false"),
    );
  }
  expect(
    screen.getByLabelText("Other dental history (optional)"),
  ).toHaveAttribute("maxLength", "255");
});

test("renders every clinical examination question with its options", () => {
  render(<PatientDentalPage />);
  expect(
    screen.getByRole("heading", { name: "Clinical Examination" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "A. Extraoral examination" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "B. Intraoral examination" }),
  ).toBeInTheDocument();

  const expected: Record<string, string[]> = {
    "Facial symmetry": ["Normal", "Asymmetrical"],
    "Facial swelling": ["Absent", "Present"],
    Lymphadenopathy: ["Absent", "Present", "Not assessed"],
    "Mouth opening": ["Normal", "Limited"],
    "Oral hygiene": ["Good", "Fair", "Poor"],
    Plaque: ["None", "Mild", "Moderate", "Heavy"],
    Calculus: ["Absent", "Present"],
    "Gingival condition": ["Healthy", "Inflamed", "Bleeding"],
    Caries: ["Absent", "Non-cavitated", "Cavitated"],
    "Missing teeth": ["Absent", "Present"],
    "Fractured teeth": ["Absent", "Present"],
    "Mucosal lesions": ["Absent", "Present"],
    Malocclusion: ["Not suspected", "Suspected"],
  };
  for (const [question, options] of Object.entries(expected)) {
    const group = screen.getByRole("radiogroup", { name: question });
    const radios = within(group).getAllByRole("radio");
    expect(radios.map((radio) => radio.textContent)).toEqual(options);
    radios.forEach((radio) =>
      expect(radio).toHaveAttribute("aria-checked", "false"),
    );
  }
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
});

test("renders the chief complaint section", () => {
  render(<PatientDentalPage />);
  expect(
    screen.getByRole("heading", { name: "Chief Complaint" }),
  ).toBeInTheDocument();
  const input = screen.getByLabelText("Chief complaint");
  expect(input).toHaveValue("");
  expect(input).toHaveAttribute("maxLength", "255");
  expect(input).toHaveAttribute(
    "placeholder",
    "What brings the patient to the dental station?",
  );
});

test("selecting a dental history option checks only that option within its question", async () => {
  const user = userEvent.setup();
  render(<PatientDentalPage />);
  const toothache = screen.getByRole("radiogroup", { name: "Toothache" });
  const currentToothache = screen.getByRole("radiogroup", {
    name: "Current toothache",
  });

  await user.click(within(toothache).getByRole("radio", { name: "Yes" }));
  expect(within(toothache).getByRole("radio", { name: "Yes" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  expect(
    within(currentToothache).getByRole("radio", { name: "Yes" }),
  ).toHaveAttribute("aria-checked", "false");

  await user.click(within(toothache).getByRole("radio", { name: "No" }));
  expect(within(toothache).getByRole("radio", { name: "Yes" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
  expect(within(toothache).getByRole("radio", { name: "No" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
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

const radio = (question: string, option: string) =>
  within(screen.getByRole("radiogroup", { name: question })).getByRole(
    "radio",
    { name: option },
  );
const otherHistoryInput = () =>
  screen.getByLabelText("Other dental history (optional)");
const chiefComplaintInput = () => screen.getByLabelText("Chief complaint");

test("loads each visit's saved record when switching visits and discards unsaved edits", async () => {
  const user = userEvent.setup();
  savedRecords = {
    [latest.id]: dentalRecord({
      id: 1,
      visitId: latest.id,
      toothache: true,
      brushingFrequency: "twice",
      otherDentalHistory: "Braces",
      chiefComplaint: "Pain in lower left molar",
      calculus: true,
      plaque: "heavy",
    }),
    [older.id]: dentalRecord({ id: 2, visitId: older.id, toothache: false }),
  };
  render(<PatientDentalPage />);
  const latestDate = formatVisitDate(latest.date);
  const olderDate = formatVisitDate(older.date);

  await waitFor(() =>
    expect(radio("Toothache", "Yes")).toHaveAttribute("aria-checked", "true"),
  );
  expect(radio("Brushing frequency", "Twice")).toHaveAttribute(
    "aria-checked",
    "true",
  );
  expect(otherHistoryInput()).toHaveValue("Braces");
  expect(chiefComplaintInput()).toHaveValue("Pain in lower left molar");
  expect(radio("Calculus", "Present")).toHaveAttribute("aria-checked", "true");
  expect(radio("Plaque", "Heavy")).toHaveAttribute("aria-checked", "true");
  await user.click(radio("Bleeding gums", "Yes"));

  await user.click(screen.getByRole("button", { name: latestDate }));
  await user.click(screen.getByRole("button", { name: olderDate }));
  expect(dentalQuery).toHaveBeenLastCalledWith({ visitId: older.id });
  expect(radio("Toothache", "No")).toHaveAttribute("aria-checked", "true");
  expect(radio("Brushing frequency", "Twice")).toHaveAttribute(
    "aria-checked",
    "false",
  );
  expect(radio("Bleeding gums", "Yes")).toHaveAttribute(
    "aria-checked",
    "false",
  );
  expect(otherHistoryInput()).toHaveValue("");
  expect(chiefComplaintInput()).toHaveValue("");
  expect(radio("Calculus", "Present")).toHaveAttribute("aria-checked", "false");

  await user.click(screen.getByRole("button", { name: olderDate }));
  await user.click(screen.getByRole("button", { name: latestDate }));
  expect(radio("Toothache", "Yes")).toHaveAttribute("aria-checked", "true");
  expect(radio("Bleeding gums", "Yes")).toHaveAttribute(
    "aria-checked",
    "false",
  );
});

test("creates a record for a visit without one, sending unanswered fields as null", async () => {
  const user = userEvent.setup();
  render(
    <>
      <Toaster />
      <PatientDentalPage />
    </>,
  );

  await user.click(radio("Toothache", "Yes"));
  await user.click(radio("Brushing frequency", "3+ times"));
  await user.type(otherHistoryInput(), "  Braces  ");
  await user.type(chiefComplaintInput(), "  Bleeding when brushing  ");
  await user.click(radio("Lymphadenopathy", "Not assessed"));
  await user.click(radio("Caries", "Non-cavitated"));
  await user.click(radio("Calculus", "Present"));
  await user.click(radio("Mucosal lesions", "Absent"));
  await user.click(
    screen.getByRole("button", { name: "Save Dental Consultation" }),
  );

  expect(createMutate).toHaveBeenCalledWith({
    visitId: latest.id,
    previousDentalVisit: null,
    previousDentalTreatment: null,
    toothache: true,
    extraction: null,
    dentalTrauma: null,
    currentToothache: null,
    toothSensitivity: null,
    bleedingGums: null,
    brushingFrequency: "3+ times",
    fluorideToothpaste: null,
    sugarConsumption: null,
    otherDentalHistory: "Braces",
    chiefComplaint: "Bleeding when brushing",
    facialSymmetry: null,
    facialSwelling: null,
    lymphadenopathy: "not assessed",
    mouthOpening: null,
    oralHygiene: null,
    plaque: null,
    calculus: true,
    gingivalCondition: null,
    caries: "non-cavitated",
    missingTeeth: null,
    fracturedTeeth: null,
    mucosalLesions: false,
    malocclusion: null,
  });
  expect(updateMutate).not.toHaveBeenCalled();

  const saved = dentalRecord({
    id: 5,
    visitId: latest.id,
    toothache: true,
    brushingFrequency: "3+ times",
    otherDentalHistory: "Braces",
    chiefComplaint: "Bleeding when brushing",
  });
  act(() => createOptions.onSuccess(saved));
  expect(setData).toHaveBeenCalledWith({ visitId: latest.id }, saved);
  expect(
    await screen.findByText("Dental consultation saved!"),
  ).toBeInTheDocument();

  // The form is clean again, so saving without edits sends nothing.
  await user.click(
    screen.getByRole("button", { name: "Save Dental Consultation" }),
  );
  expect(await screen.findByText("No form field changed!")).toBeInTheDocument();
  expect(createMutate).toHaveBeenCalledTimes(1);
});

test("updates the visit's existing record by id", async () => {
  const user = userEvent.setup();
  savedRecords = {
    [latest.id]: dentalRecord({
      id: 7,
      visitId: latest.id,
      toothache: true,
      chiefComplaint: "Toothache",
    }),
  };
  render(<PatientDentalPage />);

  await user.click(radio("Toothache", "No"));
  await user.clear(chiefComplaintInput());
  await user.type(chiefComplaintInput(), "   ");
  await user.click(
    screen.getByRole("button", { name: "Save Dental Consultation" }),
  );

  // A blank complaint is sent as null so it clears the saved value.
  expect(updateMutate).toHaveBeenCalledWith(
    expect.objectContaining({
      id: 7,
      toothache: false,
      extraction: null,
      chiefComplaint: null,
    }),
  );
  expect(updateMutate.mock.calls[0][0]).not.toHaveProperty("visitId");
  expect(createMutate).not.toHaveBeenCalled();
});

test("Reset Form restores the last saved values", async () => {
  const user = userEvent.setup();
  savedRecords = {
    [latest.id]: dentalRecord({ id: 7, visitId: latest.id, toothache: true }),
  };
  render(<PatientDentalPage />);

  await user.click(radio("Toothache", "No"));
  await user.type(otherHistoryInput(), "Filling");
  await user.type(chiefComplaintInput(), "Swelling");
  await user.click(screen.getByRole("button", { name: "Reset Form" }));

  expect(radio("Toothache", "Yes")).toHaveAttribute("aria-checked", "true");
  expect(otherHistoryInput()).toHaveValue("");
  expect(chiefComplaintInput()).toHaveValue("");
});

test("shows loading and error states for the visit's dental record", () => {
  dentalQuery.mockReturnValue({
    data: undefined,
    isLoading: true,
    isError: false,
  } as unknown as ReturnType<typeof dentalQuery>);
  const { unmount } = render(<PatientDentalPage />);
  expect(screen.getByText("Loading dental records...")).toBeInTheDocument();
  unmount();

  dentalQuery.mockReturnValue({
    data: undefined,
    isLoading: false,
    isError: true,
  } as unknown as ReturnType<typeof dentalQuery>);
  render(<PatientDentalPage />);
  expect(
    screen.getByText(/Unable to load dental records for this visit/),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Save Dental Consultation" }),
  ).not.toBeInTheDocument();
});
