import EditPatientForm from "@/components/patient/EditPatientForm";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const mutate = vi.fn();
vi.mock("@/components/interactive/inputs/WebcamInput", () => ({
  WebcamInput: () => null,
}));
vi.mock("@/utils/trpc", () => ({
  trpc: {
    useUtils: () => ({ patientsRouter: { getById: { invalidate: vi.fn() } } }),
    patientsRouter: {
      update: { useMutation: () => ({ mutate, isPending: false }) },
    },
  },
}));
const patient = {
  id: 1,
  name: "John",
  identificationNumber: "ID",
  contactNo: " +65 123-456 ",
  gender: "male",
  drugAllergy: "None",
  dateOfBirth: new Date("1985-03-15T00:00:00Z"),
  hasPoorCard: false,
  hasBS2Card: false,
  hasSabaiCard: false,
  patientImageUrl: null,
} as Parameters<typeof EditPatientForm>[0]["patient"];

beforeEach(() => mutate.mockClear());
it("prefills and submits unchanged DOB as ISO while preserving the contact", async () => {
  const user = userEvent.setup();
  render(<EditPatientForm patient={patient} />);
  expect(screen.getByPlaceholderText("DD/MM/YYYY")).toHaveValue("15/03/1985");
  await user.click(screen.getByRole("button", { name: "Save Changes" }));
  expect(mutate).toHaveBeenCalledWith(
    expect.objectContaining({
      dateOfBirth: "1985-03-15",
      contactNo: " +65 123-456 ",
    }),
    expect.anything(),
  );
});
it("validates dates and required fields before submitting a changed ISO DOB", async () => {
  const user = userEvent.setup();
  render(<EditPatientForm patient={patient} />);
  const date = screen.getByPlaceholderText("DD/MM/YYYY");
  const contact = screen.getByLabelText(/Contact Number/);
  await user.clear(date);
  await user.type(date, "31/02/2024");
  await user.click(screen.getByRole("button", { name: "Save Changes" }));
  expect(await screen.findByText(/Enter a valid date/)).toBeInTheDocument();
  expect(mutate).not.toHaveBeenCalled();
  await user.clear(date);
  await user.clear(contact);
  await user.click(screen.getByRole("button", { name: "Save Changes" }));
  expect(await screen.findByText("Missing Date of Birth!")).toBeInTheDocument();
  expect(
    await screen.findByText("Missing Contact Number!"),
  ).toBeInTheDocument();
  expect(mutate).not.toHaveBeenCalled();
  await user.type(date, "29/02/2024");
  await user.type(contact, "0123");
  await user.click(screen.getByRole("button", { name: "Save Changes" }));
  expect(mutate).toHaveBeenCalledWith(
    expect.objectContaining({ dateOfBirth: "2024-02-29", contactNo: "0123" }),
    expect.anything(),
  );
});

it.each([null, new Date(NaN)])(
  "keeps absent or invalid DOB and contact empty and blocks save",
  async (dob) => {
    const user = userEvent.setup();
    const missing = {
      ...patient,
      dateOfBirth: dob,
      contactNo: null,
    } as unknown as typeof patient;
    render(<EditPatientForm patient={missing} />);
    expect(screen.getByPlaceholderText("DD/MM/YYYY")).toHaveValue("");
    expect(screen.getByLabelText(/Contact Number/)).toHaveValue("");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(
      await screen.findByText("Missing Date of Birth!"),
    ).toBeInTheDocument();
    expect(
      await screen.findByText("Missing Contact Number!"),
    ).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  },
);
it("preserves the UTC day of an offset DOB and omits an unchanged remote photo", async () => {
  const user = userEvent.setup();
  const offsetPatient = {
    ...patient,
    dateOfBirth: "1985-03-15T23:30:00-02:00",
    patientImageUrl: "https://example.com/photo.jpg",
  } as unknown as typeof patient;
  render(<EditPatientForm patient={offsetPatient} />);
  expect(screen.getByPlaceholderText("DD/MM/YYYY")).toHaveValue("16/03/1985");
  await user.click(screen.getByRole("button", { name: "Save Changes" }));
  expect(mutate.mock.calls[0][0]).toMatchObject({ dateOfBirth: "1985-03-16" });
  expect(mutate.mock.calls[0][0]).not.toHaveProperty("patientImage");
});
