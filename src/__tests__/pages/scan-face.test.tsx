import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
  fireEvent,
  act,
} from "@testing-library/react";
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
import { useState } from "react";

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
    villageCodesRouter: {
      list: {
        useQuery: vi.fn(),
      },
    },
    useSaveOnWrite: vi.fn((key, initialValue) => {
      // mocking localstorage probably not required for this.
      const [state, setState] = useState(initialValue);
      return [state, setState];
    }),
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
    const drugAllergyInput = container.querySelector('input[name="drugAllergy"]');

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
    const drugAllergyInput = container.querySelector('input[name="drugAllergy"]');
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
    const drugAllergyInput = container.querySelector('input[name="drugAllergy"]');
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
    render(<ScanFacePage />);
    const captureButton = screen.getByRole("button", { name: "Capture" });
    user.click(captureButton);

    const retakeButton = await screen.findByRole("button", {
      name: "Retake Photo",
    });
    expect(retakeButton).toBeInTheDocument();
  });

  it("changes the image element to a video element when the 'Retake Photo' button is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<ScanFacePage />);
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

    mockTrpc.patientsRouter.findFaceMatches.useMutation.mockReturnValue({
      data: undefined,
      isPending: true,
      mutate: vi.fn(),
    });
    mockTrpc.patientsRouter.listMatchingPatients.useMutation.mockReturnValue({
      data: undefined,
      isPending: false,
      mutate: vi.fn(),
    });

    render(<ScanFacePage />);

    user.click(screen.getByRole("button", { name: "Capture" }));

    await waitFor(() => {
      assertLoadingSpinner("Finding face matches...");
    });
  });

  it("displays a loading spinner while fetching the matching patients list", async () => {
    const user = userEvent.setup();

    mockTrpc.patientsRouter.findFaceMatches.useMutation.mockReturnValue({
      data: undefined,
      isPending: false,
      mutate: vi.fn(),
    });
    mockTrpc.patientsRouter.listMatchingPatients.useMutation.mockReturnValue({
      data: undefined,
      isPending: true,
      mutate: vi.fn(),
    });

    render(<ScanFacePage />);

    user.click(screen.getByRole("button", { name: "Capture" }));

    await waitFor(() => {
      assertLoadingSpinner("Finding matching patients...");
    });
  });

  it("displays a message that there is no matching patients, and a button to register new patients if no matching patients", async () => {
    const user = userEvent.setup();

    mockTrpc.patientsRouter.findFaceMatches.useMutation.mockReturnValue({
      data: undefined,
      isPending: false,
      mutate: vi.fn(),
    });
    mockTrpc.patientsRouter.listMatchingPatients.useMutation.mockReturnValue({
      data: undefined,
      isPending: true,
      mutate: vi.fn(),
    });

    render(<ScanFacePage />);

    user.click(screen.getByRole("button", { name: "Capture" }));

    mockTrpc.patientsRouter.findFaceMatches.useMutation.mockReturnValue({
      data: undefined,
      isPending: false,
      mutate: vi.fn(),
    });
    mockTrpc.patientsRouter.listMatchingPatients.useMutation.mockReturnValue({
      data: undefined,
      isPending: false,
      mutate: vi.fn(),
    });

    await waitFor(() => {
      expect(screen.getByText("No matches found")).toBeInTheDocument();
    });
  });
  it("displays a list of patients with high similarity score when face is scanned, if exists in database", () => {});
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
    const drugAllergyInput = container.querySelector('input[name="drugAllergy"]');
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
});
