import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { trpc } from "@/utils/trpc";
import {
  assertBreadcrumbs,
  assertLoadingSpinner,
} from "@/__tests__/utils/helper-functions";
import { Toaster, toast } from "react-hot-toast";
import ScanFacePage from "@/pages/scan-face";
import Webcam from "react-webcam";
import { VillageCodeProvider } from "@/lib/context/VillageCodeContext";

// Mock tRPC
vi.mock("@/utils/trpc", () => ({
  trpc: {
    useUtils: vi.fn(),
    patientsRouter: {
      create: {
        useMutation: vi.fn(),
      },
      searchPatientsByPicture: {
        useMutation: vi.fn(),
      },
      list: {
        useQuery: vi.fn(),
      },
      updateFace: {
        useMutation: vi.fn(),
      },
    },
    visitsRouter: {
      create: {
        useMutation: vi.fn(),
      },
    },
    villageCodesRouter: {
      list: {
        useQuery: vi.fn(),
      },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTrpc = trpc as any;

// instead of data:image/jpeg;base64,qioweqowiejioqwjeoiqwoeojqwe...
// this is the imgSrc variable that the codebase uses after webcam capture
// test libaries can't do this because there's no live video feed, so we
// overwrite the prototype here so that imgSrc is flipped
// to an actual string to simulate picture taking
Webcam.prototype.getScreenshot = () =>
  "data:image/jpeg;base64,mock-string-data";

describe("ScanFacePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toast.dismissAll();

    mockTrpc.useUtils.mockImplementation(() => ({
      patientsRouter: {
        list: { invalidate: vi.fn() },
        listWithLatestVisit: { invalidate: vi.fn() },
        getById: { invalidate: vi.fn() },
      },
      visitsRouter: {
        hasRecentVisit: {
          fetch: vi.fn().mockResolvedValue({
            hasRecentVisit: false,
            existingVisitDate: null,
          }),
        },
      },
    }));
    mockTrpc.patientsRouter.create.useMutation.mockReturnValue({
      mutate: vi.fn(),
    });
    mockTrpc.patientsRouter.list.useQuery.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
    mockTrpc.patientsRouter.updateFace.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockTrpc.visitsRouter.create.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });
    mockTrpc.patientsRouter.searchPatientsByPicture.useMutation.mockReturnValue(
      {
        mutate: vi.fn(),
        isIdle: false,
        isPending: false,
        isError: false,
        data: [],
      },
    );
  });

  afterEach(() => {
    cleanup();
    localStorage.removeItem("villageCodeState");
  });

  it("renders page title", () => {
    render(<ScanFacePage />);
    expect(
      screen.getByRole("heading", { name: "Scan Face" }),
    ).toBeInTheDocument();
  });

  it("renders breadcrumbs", () => {
    render(<ScanFacePage />);
    assertBreadcrumbs(["Home", "Scan Face"]);
  });

  it("displays a webcam and a form in registration mode", async () => {
    const user = userEvent.setup();

    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: [
        { id: "AA", name: "Village Alpha", colorHex: "", isVisible: true },
        { id: "BB", name: "Village Beta", colorHex: "", isVisible: true },
      ],
      isLoading: false,
    });

    const { container } = render(
      <VillageCodeProvider>
        <ScanFacePage />
      </VillageCodeProvider>,
    );
    const captureButton = screen.getByRole("button", { name: "Capture" });

    user.click(captureButton);

    await screen.findByText("No matches found");

    await user.click(
      screen.getByRole("button", { name: "Register New Patient" }),
    );

    const nameInput = container.querySelector('input[name="name"]');
    const identificationNumberInput = container.querySelector(
      'input[name="identificationNumber"]',
    );
    const contactNoInput = container.querySelector('input[name="contactNo"]');
    const drugAllergyInput = container.querySelector(
      'input[name="drugAllergy"]',
    );

    expect(nameInput).toBeInTheDocument();
    expect(identificationNumberInput).toBeInTheDocument();
    expect(contactNoInput).toBeInTheDocument();
    expect(drugAllergyInput).toBeInTheDocument();

    expect(screen.getByText("Has POOR Card?")).toBeInTheDocument();
    expect(screen.getByText("Has BS2 Card?")).toBeInTheDocument();
    expect(screen.getByText("Has Sabai Card?")).toBeInTheDocument();

    expect(
      screen.getByRole("button", { name: "Create New Patient" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Match Instead" }),
    ).toBeInTheDocument();
  });

  it("displays an error if a village code is not selected while creating a patient", async () => {
    const user = userEvent.setup();

    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: [],
      isLoading: false,
    });

    const { container } = render(
      <VillageCodeProvider>
        <ScanFacePage />
        <Toaster />
      </VillageCodeProvider>,
    );
    const captureButton = screen.getByRole("button", { name: "Capture" });

    user.click(captureButton);

    await screen.findByText("No matches found");

    await user.click(
      screen.getByRole("button", { name: "Register New Patient" }),
    );

    const nameInput = container.querySelector('input[name="name"]');
    const identificationNumberInput = container.querySelector(
      'input[name="identificationNumber"]',
    );
    const contactNoInput = container.querySelector('input[name="contactNo"]');
    const drugAllergyInput = container.querySelector(
      'input[name="drugAllergy"]',
    );
    const dobInput = container.querySelector('input[name="dateOfBirth"]');
    const dropdownButton = container.querySelector(
      'button[name="gender-dropdown-button"]',
    );

    await user.type(nameInput!, "Valid name");
    await user.type(identificationNumberInput!, "Valid id");
    await user.type(contactNoInput!, "1234567");
    await user.type(drugAllergyInput!, "drug allergies");
    await user.type(dobInput!, "2000-10-10");
    await user.click(dropdownButton!);
    const dropdownButtonMale = container.querySelector(
      'button[name="gender-male-dropdown-option"]',
    );
    await user.click(dropdownButtonMale!);

    const createButton = screen.getByRole("button", {
      name: "Create New Patient",
    });
    await user.click(createButton);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Please select a village code before submitting.",
    );
  });

  it("displays an error if the registration form's button is clicked while an image is not captured", async () => {
    const user = userEvent.setup();

    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: [{ id: "1", name: "Village Alpha", colorHex: "", isVisible: true }],
      isLoading: false,
    });

    const { container } = render(
      <VillageCodeProvider>
        <ScanFacePage />
        <Toaster />
      </VillageCodeProvider>,
    );
    const captureButton = screen.getByRole("button", { name: "Capture" });

    user.click(captureButton);

    await screen.findByText("No matches found");

    await user.click(
      screen.getByRole("button", { name: "Register New Patient" }),
    );

    const nameInput = container.querySelector('input[name="name"]');
    const identificationNumberInput = container.querySelector(
      'input[name="identificationNumber"]',
    );
    const contactNoInput = container.querySelector('input[name="contactNo"]');
    const drugAllergyInput = container.querySelector(
      'input[name="drugAllergy"]',
    );
    const dobInput = container.querySelector('input[name="dateOfBirth"]');
    const dropdownButton = container.querySelector(
      'button[name="gender-dropdown-button"]',
    );

    await user.type(nameInput!, "Valid name");
    await user.type(identificationNumberInput!, "Valid id");
    await user.type(contactNoInput!, "1234567");
    await user.type(drugAllergyInput!, "drug allergies");
    await user.type(dobInput!, "2000-10-10");
    await user.click(dropdownButton!);
    const dropdownButtonMale = container.querySelector(
      'button[name="gender-male-dropdown-option"]',
    );
    await user.click(dropdownButtonMale!);

    const createButton = screen.getByRole("button", {
      name: "Create New Patient",
    });

    await user.click(screen.getByRole("button", { name: "Retake Photo" }));
    await user.click(createButton);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Please capture a face image before submitting.",
    );
  });

  it("displays a webcam and a capture button upon entering the page", async () => {
    render(<ScanFacePage />);
    const webcam = document.getElementById("webcam");
    const captureButton = screen.getByRole("button", { name: "Capture" });

    expect(webcam).toBeInTheDocument();
    expect(captureButton).toBeInTheDocument();
  });

  it("changes the button from 'Capture' to 'Retake Photo' when button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <VillageCodeProvider>
        <ScanFacePage />
      </VillageCodeProvider>,
    );
    const captureButton = screen.getByRole("button", { name: "Capture" });
    user.click(captureButton);

    const retakeButton = await screen.findByRole("button", {
      name: "Retake Photo",
    });
    expect(retakeButton).toBeInTheDocument();
  });

  it("changes the image element to a video element when the 'Retake Photo' button is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <VillageCodeProvider>
        <ScanFacePage />
      </VillageCodeProvider>,
    );
    const captureButton = screen.getByRole("button", { name: "Capture" });

    expect(
      container.querySelector(
        'img[src="data:image/jpeg;base64,mock-string-data"]',
      ),
    ).not.toBeInTheDocument();
    expect(document.getElementById("webcam")).toBeInTheDocument();

    user.click(captureButton);

    await waitFor(() => {
      const capturedImg = container.querySelector(
        'img[src="data:image/jpeg;base64,mock-string-data"]',
      );
      expect(capturedImg).toBeInTheDocument();
      expect(document.getElementById("webcam")).not.toBeInTheDocument();
    });
  });

  it("displays a loading spinner while locating face matches", async () => {
    const user = userEvent.setup();

    mockTrpc.patientsRouter.searchPatientsByPicture.useMutation.mockReturnValue(
      {
        data: undefined,
        isPending: true,
        mutate: vi.fn(),
      },
    );

    render(
      <VillageCodeProvider>
        <ScanFacePage />
      </VillageCodeProvider>,
    );

    user.click(screen.getByRole("button", { name: "Capture" }));

    await waitFor(() => {
      assertLoadingSpinner("Finding face matches...");
    });
  });

  it("displays a message that there is no matching patients, and a button to register new patients if no matching patients", async () => {
    const user = userEvent.setup();

    mockTrpc.patientsRouter.searchPatientsByPicture.useMutation.mockReturnValue(
      {
        data: [],
        isPending: false,
        mutate: vi.fn(),
      },
    );

    render(
      <VillageCodeProvider>
        <ScanFacePage />
      </VillageCodeProvider>,
    );

    user.click(screen.getByRole("button", { name: "Capture" }));

    await waitFor(() => {
      expect(screen.getByText("No matches found")).toBeInTheDocument();
    });
  });

  it("disables the registration button and displays a loading message while registering patients", async () => {
    const user = userEvent.setup();

    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: [{ id: "1", name: "Village Alpha", colorHex: "", isVisible: true }],
      isLoading: false,
    });

    const { container } = render(
      <VillageCodeProvider>
        <ScanFacePage />
        <Toaster />
      </VillageCodeProvider>,
    );
    const captureButton = screen.getByRole("button", { name: "Capture" });

    user.click(captureButton);

    await screen.findByText("No matches found");

    await user.click(
      screen.getByRole("button", { name: "Register New Patient" }),
    );

    const nameInput = container.querySelector('input[name="name"]');
    const identificationNumberInput = container.querySelector(
      'input[name="identificationNumber"]',
    );
    const contactNoInput = container.querySelector('input[name="contactNo"]');
    const drugAllergyInput = container.querySelector(
      'input[name="drugAllergy"]',
    );
    const dobInput = container.querySelector('input[name="dateOfBirth"]');
    const dropdownButton = container.querySelector(
      'button[name="gender-dropdown-button"]',
    );

    await user.type(nameInput!, "Valid name");
    await user.type(identificationNumberInput!, "Valid id");
    await user.type(contactNoInput!, "1234567");
    await user.type(drugAllergyInput!, "drug allergies");
    await user.type(dobInput!, "2000-10-10");
    await user.click(dropdownButton!);
    const dropdownButtonMale = container.querySelector(
      'button[name="gender-male-dropdown-option"]',
    );
    await user.click(dropdownButtonMale!);

    const createButton = screen.getByRole("button", {
      name: "Create New Patient",
    });

    mockTrpc.patientsRouter.create.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    });

    await user.click(createButton);
    expect(createButton).toBeDisabled();
    expect(createButton).toHaveTextContent("Creating new patient...");
  });

  const capturedImage = "data:image/jpeg;base64,mock-string-data";

  const searchablePatients = [
    {
      id: 12,
      name: "Ada Lovelace",
      identificationNumber: "ID-99",
      patientImageUrl: null,
    },
    {
      id: 44,
      name: "Grace Hopper",
      identificationNumber: "GH-1",
      patientImageUrl: null,
    },
  ];

  function selectVillage(id: number) {
    localStorage.setItem(
      "villageCodeState",
      JSON.stringify({ selectedVillageCodeId: id }),
    );
    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: [{ id, name: "Village Alpha", colorHex: "", isVisible: true }],
      isLoading: false,
    });
  }

  function mockPatientSearch() {
    mockTrpc.patientsRouter.list.useQuery.mockReturnValue({
      data: searchablePatients,
      isLoading: false,
      isError: false,
    });
  }

  async function openLinkExistingPatient(
    user: ReturnType<typeof userEvent.setup>,
  ) {
    await user.click(screen.getByRole("button", { name: "Capture" }));
    await user.click(
      await screen.findByRole("button", { name: "Link Existing Patient" }),
    );
    expect(
      await screen.findByPlaceholderText("Search by name or ID"),
    ).toBeInTheDocument();
  }

  it("shows Link Existing Patient only after a photo is taken", async () => {
    const user = userEvent.setup();
    render(
      <VillageCodeProvider>
        <ScanFacePage />
      </VillageCodeProvider>,
    );

    expect(
      screen.queryByRole("button", { name: "Link Existing Patient" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Capture" }));

    expect(
      await screen.findByRole("button", { name: "Link Existing Patient" }),
    ).toBeInTheDocument();
  });

  it("searches existing patients by name or ID and shows Update face", async () => {
    const user = userEvent.setup();
    mockPatientSearch();

    render(
      <VillageCodeProvider>
        <ScanFacePage />
      </VillageCodeProvider>,
    );

    await openLinkExistingPatient(user);

    const search = screen.getByPlaceholderText("Search by name or ID");
    await user.type(search, "Ada");

    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("ID: 0012 • ID-99")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Update face" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Grace Hopper")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "gh-1");
    expect(await screen.findByText("Grace Hopper")).toBeInTheDocument();
    expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "0012");
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.queryByText("Grace Hopper")).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "zzzz-no-patient");
    expect(
      await screen.findByText("No matching patients found."),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Update face" }),
    ).not.toBeInTheDocument();
  });

  it("updates the patient face, creates a visit, and shows a success toast", async () => {
    const user = userEvent.setup();
    selectVillage(1);
    mockPatientSearch();
    const mutate = vi.fn(
      (_input: unknown, options: { onSuccess: () => void }) => {
        options.onSuccess();
      },
    );
    mockTrpc.patientsRouter.updateFace.useMutation.mockReturnValue({
      mutate,
      isPending: false,
    });

    render(
      <VillageCodeProvider>
        <ScanFacePage />
        <Toaster />
      </VillageCodeProvider>,
    );

    await openLinkExistingPatient(user);
    await user.type(
      screen.getByPlaceholderText("Search by name or ID"),
      "Ada",
    );
    await user.click(
      await screen.findByRole("button", { name: "Update face" }),
    );

    expect(mutate).toHaveBeenCalledWith(
      {
        id: 12,
        patientImage: capturedImage,
        villageCodeId: 1,
      },
      expect.any(Object),
    );
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Face updated and visit created successfully!",
    );
    expect(
      await screen.findByRole("button", { name: "Capture" }),
    ).toBeInTheDocument();
  });

  it("shows an error toast when updating the face fails", async () => {
    const user = userEvent.setup();
    selectVillage(1);
    mockPatientSearch();
    mockTrpc.patientsRouter.updateFace.useMutation.mockReturnValue({
      mutate: vi.fn((_input: unknown, options: { onError: () => void }) => {
        options.onError();
      }),
      isPending: false,
    });

    render(
      <VillageCodeProvider>
        <ScanFacePage />
        <Toaster />
      </VillageCodeProvider>,
    );

    await openLinkExistingPatient(user);
    await user.type(
      screen.getByPlaceholderText("Search by name or ID"),
      "Ada",
    );
    await user.click(
      await screen.findByRole("button", { name: "Update face" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Failed to update face. Please try again.",
    );
    expect(
      screen.getByRole("button", { name: "Update face" }),
    ).toBeInTheDocument();
  });

  it("asks for a village code before updating a face", async () => {
    const user = userEvent.setup();
    mockPatientSearch();
    const mutate = vi.fn();
    mockTrpc.patientsRouter.updateFace.useMutation.mockReturnValue({
      mutate,
      isPending: false,
    });

    render(
      <VillageCodeProvider>
        <ScanFacePage />
        <Toaster />
      </VillageCodeProvider>,
    );

    await openLinkExistingPatient(user);
    await user.type(
      screen.getByPlaceholderText("Search by name or ID"),
      "Ada",
    );
    await user.click(
      await screen.findByRole("button", { name: "Update face" }),
    );

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Please select a village code before submitting.",
    );
    expect(mutate).not.toHaveBeenCalled();
  });

  it("disables Update face and Match Instead while the mutation is pending", async () => {
    const user = userEvent.setup();
    mockPatientSearch();
    mockTrpc.patientsRouter.updateFace.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    });

    render(
      <VillageCodeProvider>
        <ScanFacePage />
      </VillageCodeProvider>,
    );

    await openLinkExistingPatient(user);
    await user.type(
      screen.getByPlaceholderText("Search by name or ID"),
      "Ada",
    );

    expect(
      await screen.findByRole("button", { name: "Updating..." }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Match Instead" })).toBeDisabled();
  });

  it("confirms before creating a second visit when one was just recorded", async () => {
    const user = userEvent.setup();
    selectVillage(1);
    mockPatientSearch();
    const mutate = vi.fn();
    mockTrpc.patientsRouter.updateFace.useMutation.mockReturnValue({
      mutate,
      isPending: false,
    });
    mockTrpc.useUtils.mockImplementation(() => ({
      patientsRouter: {
        list: { invalidate: vi.fn() },
        listWithLatestVisit: { invalidate: vi.fn() },
        getById: { invalidate: vi.fn() },
      },
      visitsRouter: {
        hasRecentVisit: {
          fetch: vi.fn().mockResolvedValue({
            hasRecentVisit: true,
            existingVisitDate: new Date("2026-10-24T08:30:00"),
          }),
        },
      },
    }));

    render(
      <VillageCodeProvider>
        <ScanFacePage />
      </VillageCodeProvider>,
    );

    await openLinkExistingPatient(user);
    await user.type(
      screen.getByPlaceholderText("Search by name or ID"),
      "Ada",
    );
    await user.click(
      await screen.findByRole("button", { name: "Update face" }),
    );

    const confirmButton = await screen.findByRole("button", {
      name: "Confirm",
    });
    expect(mutate).not.toHaveBeenCalled();

    await user.click(confirmButton);
    expect(mutate).toHaveBeenCalledWith(
      {
        id: 12,
        patientImage: capturedImage,
        villageCodeId: 1,
      },
      expect.any(Object),
    );
  });
});
