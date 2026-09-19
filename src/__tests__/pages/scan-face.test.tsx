import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { trpc } from "@/utils/trpc";
import {
  assertBreadcrumbs,
  assertLoadingSpinner,
} from "@/__tests__/utils/helper-functions";
import { Toaster, toast } from "react-hot-toast";
import ScanFacePage from "@/pages/scan-face";
import Webcam from "react-webcam";
import {
  VillageCodeProvider,
  useVillageCode,
} from "@/lib/context/VillageCodeContext";

// Mock VillageCodeContext so selectedVillageCodeId can be controlled per-test
vi.mock("@/lib/context/VillageCodeContext", () => ({
  VillageCodeProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  useVillageCode: vi.fn(() => ({
    selectedVillageCodeId: null,
    setSelectedVillageCodeId: vi.fn(),
    villageCodes: [],
    isLoading: false,
    isError: false,
    error: null,
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockUseVillageCode = useVillageCode as any;

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
      searchPatientsByPicture: {
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

    mockTrpc.patientsRouter.create.useMutation.mockReturnValue({
      mutate: vi.fn(),
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
  });

  it("renders page title", () => {
    // Given: the page is rendered
    render(<ScanFacePage />);

    // Then: the heading "Scan Face" is visible
    expect(
      screen.getByRole("heading", { name: "Scan Face" }),
    ).toBeInTheDocument();
  });

  it("renders breadcrumbs", () => {
    // Given: the page is rendered
    render(<ScanFacePage />);

    // Then: breadcrumbs show Home and Scan Face
    assertBreadcrumbs(["Home", "Scan Face"]);
  });

  it("displays a webcam and a capture button upon entering the page", async () => {
    // Given: the page is rendered
    render(<ScanFacePage />);

    // Then: the webcam and capture button are visible
    expect(document.getElementById("webcam")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Capture" })).toBeInTheDocument();
  });

  it("changes the button from 'Capture' to 'Retake Photo' when button is clicked", async () => {
    const user = userEvent.setup();

    // Given: the page is rendered with the webcam visible
    render(<ScanFacePage />);

    // When: the capture button is clicked
    await user.click(screen.getByRole("button", { name: "Capture" }));

    // Then: the button changes to "Retake Photo"
    const retakeButton = await screen.findByRole("button", {
      name: "Retake Photo",
    });
    expect(retakeButton).toBeInTheDocument();
  });

  it("displays a loading spinner while locating face matches", async () => {
    const user = userEvent.setup();

    // Given: the face search mutation is in a pending state
    mockTrpc.patientsRouter.searchPatientsByPicture.useMutation.mockReturnValue(
      {
        data: undefined,
        isPending: true,
        mutate: vi.fn(),
      },
    );

    render(<ScanFacePage />);

    // When: the capture button is clicked
    await user.click(screen.getByRole("button", { name: "Capture" }));

    // Then: a loading spinner is displayed
    await waitFor(() => {
      assertLoadingSpinner("Finding face matches...");
    });
  });

  it("displays a message that there is no matching patients, and a button to register new patients if no matching patients", async () => {
    const user = userEvent.setup();

    // Given: the face search returns an empty result
    mockTrpc.patientsRouter.searchPatientsByPicture.useMutation.mockReturnValue(
      {
        data: [],
        isPending: false,
        mutate: vi.fn(),
      },
    );

    render(<ScanFacePage />);

    // When: the capture button is clicked
    await user.click(screen.getByRole("button", { name: "Capture" }));

    // Then: "No matches found" is displayed
    await waitFor(() => {
      expect(screen.getByText("No matches found")).toBeInTheDocument();
    });
  });

  it("displays a webcam and a form in registration mode", async () => {
    const user = userEvent.setup();

    // Given: no matches were found after capturing
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

    await user.click(screen.getByRole("button", { name: "Capture" }));
    await screen.findByText("No matches found");

    // When: "Register New Patient" is clicked
    await user.click(
      screen.getByRole("button", { name: "Register New Patient" }),
    );

    // Then: the registration form fields and action buttons are displayed
    expect(container.querySelector('input[name="name"]')).toBeInTheDocument();
    expect(
      container.querySelector('input[name="identificationNumber"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('input[name="contactNo"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('input[name="drugAllergy"]'),
    ).toBeInTheDocument();

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

    // Given: the registration form is open with all fields filled but no village code available
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

    await user.click(screen.getByRole("button", { name: "Capture" }));
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
    await user.click(
      container.querySelector('button[name="gender-male-dropdown-option"]')!,
    );

    // When: "Create New Patient" is clicked without a village code selected
    await user.click(
      screen.getByRole("button", { name: "Create New Patient" }),
    );

    // Then: an error toast is shown prompting the user to select a village code
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Please select a village code before submitting.",
    );
  });

  it("displays an error if the registration form's button is clicked while an image is not captured", async () => {
    const user = userEvent.setup();

    // Given: the registration form is open with all fields filled but no image captured
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

    await user.click(screen.getByRole("button", { name: "Capture" }));
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
    await user.click(
      container.querySelector('button[name="gender-male-dropdown-option"]')!,
    );

    const createButton = screen.getByRole("button", {
      name: "Create New Patient",
    });

    // When: the user retakes the photo (clearing the captured image) then clicks Create
    await user.click(screen.getByRole("button", { name: "Retake Photo" }));
    await user.click(createButton);

    // Then: an error toast is shown prompting the user to capture an image
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Please capture a face image before submitting.",
    );
  });

  it("disables the registration button and displays a loading message while registering patients", async () => {
    const user = userEvent.setup();

    // Given: the registration form is fully filled and submitted
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

    await user.click(screen.getByRole("button", { name: "Capture" }));
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
    await user.click(
      container.querySelector('button[name="gender-male-dropdown-option"]')!,
    );

    const createButton = screen.getByRole("button", {
      name: "Create New Patient",
    });

    // When: creation is pending after clicking Create
    mockTrpc.patientsRouter.create.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: true,
    });

    await user.click(createButton);

    // Then: the create button is disabled and shows a loading message
    expect(createButton).toBeDisabled();
    expect(createButton).toHaveTextContent("Creating new patient...");
  });

  // --- AWS integration: searchPatientsByPicture ---

  it("calls searchPatientsByPicture with the captured image data", async () => {
    const user = userEvent.setup();
    const mockMutate = vi.fn();

    // Given: the page is rendered with a mocked searchPatientsByPicture mutation
    mockTrpc.patientsRouter.searchPatientsByPicture.useMutation.mockReturnValue(
      {
        mutate: mockMutate,
        isIdle: false,
        isPending: false,
        isError: false,
        data: [],
      },
    );

    render(<ScanFacePage />);

    // When: the capture button is clicked
    await user.click(screen.getByRole("button", { name: "Capture" }));

    // Then: searchPatientsByPicture is called with the captured image data
    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        picture: "data:image/jpeg;base64,mock-string-data",
      });
    });
  });

  it("displays an error message when the AWS face search fails", async () => {
    const user = userEvent.setup();

    // Given: the face search mutation returns an error
    mockTrpc.patientsRouter.searchPatientsByPicture.useMutation.mockReturnValue(
      {
        mutate: vi.fn(),
        isIdle: false,
        isPending: false,
        isError: true,
        data: undefined,
      },
    );

    render(<ScanFacePage />);

    // When: the capture button is clicked
    await user.click(screen.getByRole("button", { name: "Capture" }));

    // Then: a server error message is displayed
    await waitFor(() => {
      expect(
        screen.getByText(/server encountered an error/i),
      ).toBeInTheDocument();
    });
  });

  it("displays a table of matching patients when AWS returns results", async () => {
    const user = userEvent.setup();

    // Given: the face search returns multiple patient matches
    mockTrpc.patientsRouter.searchPatientsByPicture.useMutation.mockReturnValue(
      {
        mutate: vi.fn(),
        isIdle: false,
        isPending: false,
        isError: false,
        data: [
          { id: 1, name: "John Doe", patientImageUrl: null },
          { id: 2, name: "Jane Smith", patientImageUrl: null },
        ],
      },
    );

    render(<ScanFacePage />);

    // When: the capture button is clicked
    await user.click(screen.getByRole("button", { name: "Capture" }));

    // Then: a table of matching patients is displayed
    await waitFor(() => {
      expect(screen.getByText("Found matches:")).toBeInTheDocument();
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Jane Smith")).toBeInTheDocument();
      expect(screen.getByText("0001")).toBeInTheDocument();
      expect(screen.getByText("0002")).toBeInTheDocument();
    });
  });

  it("displays a 'Register New Patient Instead' button when matches are found", async () => {
    const user = userEvent.setup();

    // Given: the face search returns at least one match
    mockTrpc.patientsRouter.searchPatientsByPicture.useMutation.mockReturnValue(
      {
        mutate: vi.fn(),
        isIdle: false,
        isPending: false,
        isError: false,
        data: [{ id: 1, name: "John Doe", patientImageUrl: null }],
      },
    );

    render(<ScanFacePage />);

    // When: the capture button is clicked
    await user.click(screen.getByRole("button", { name: "Capture" }));

    // Then: the "Register New Patient Instead" button is shown alongside the results
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Register New Patient Instead" }),
      ).toBeInTheDocument();
    });
  });

  it("switches to registration form when 'Register New Patient Instead' is clicked", async () => {
    const user = userEvent.setup();

    // Given: the face search returned matches and the results are displayed
    mockTrpc.patientsRouter.searchPatientsByPicture.useMutation.mockReturnValue(
      {
        mutate: vi.fn(),
        isIdle: false,
        isPending: false,
        isError: false,
        data: [{ id: 1, name: "John Doe", patientImageUrl: null }],
      },
    );

    mockTrpc.villageCodesRouter.list.useQuery.mockReturnValue({
      data: [{ id: "1", name: "Village Alpha", colorHex: "", isVisible: true }],
      isLoading: false,
    });

    render(
      <VillageCodeProvider>
        <ScanFacePage />
      </VillageCodeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Capture" }));
    await waitFor(() =>
      screen.getByRole("button", { name: "Register New Patient Instead" }),
    );

    // When: "Register New Patient Instead" is clicked
    await user.click(
      screen.getByRole("button", { name: "Register New Patient Instead" }),
    );

    // Then: the registration form is displayed
    expect(
      screen.getByRole("button", { name: "Create New Patient" }),
    ).toBeInTheDocument();
  });

  // --- AWS integration: create patient ---

  it("shows a success toast and resets the form after successful patient creation", async () => {
    const user = userEvent.setup();

    let capturedOnSuccess: (() => void) | undefined;
    const mockMutate = vi.fn((_data, callbacks) => {
      capturedOnSuccess = callbacks?.onSuccess;
    });

    // Given: the registration form is fully filled and submitted successfully
    mockTrpc.patientsRouter.create.useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    mockUseVillageCode.mockReturnValue({
      selectedVillageCodeId: 1,
      setSelectedVillageCodeId: vi.fn(),
      villageCodes: [{ id: 1, name: "Village Alpha" }],
      isLoading: false,
      isError: false,
      error: null,
    });

    const { container } = render(
      <VillageCodeProvider>
        <ScanFacePage />
        <Toaster />
      </VillageCodeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Capture" }));
    await screen.findByText("No matches found");
    await user.click(
      screen.getByRole("button", { name: "Register New Patient" }),
    );

    await user.type(container.querySelector('input[name="name"]')!, "John Doe");
    await user.type(
      container.querySelector('input[name="identificationNumber"]')!,
      "ID123",
    );
    await user.type(
      container.querySelector('input[name="contactNo"]')!,
      "1234567",
    );
    await user.type(
      container.querySelector('input[name="drugAllergy"]')!,
      "none",
    );
    await user.type(
      container.querySelector('input[name="dateOfBirth"]')!,
      "2000-01-01",
    );
    await user.click(
      container.querySelector('button[name="gender-dropdown-button"]')!,
    );
    await user.click(
      container.querySelector('button[name="gender-male-dropdown-option"]')!,
    );

    await user.click(
      screen.getByRole("button", { name: "Create New Patient" }),
    );

    // When: the creation succeeds
    act(() => capturedOnSuccess?.());

    // Then: a success toast is shown and the form resets to the webcam view
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Patient created successfully!",
    );
    expect(document.getElementById("webcam")).toBeInTheDocument();
  });

  it("shows an error toast when patient creation fails", async () => {
    const user = userEvent.setup();

    let capturedOnError: ((error: unknown) => void) | undefined;
    const mockMutate = vi.fn((_data, callbacks) => {
      capturedOnError = callbacks?.onError;
    });

    // Given: the registration form is fully filled and submitted
    mockTrpc.patientsRouter.create.useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    mockUseVillageCode.mockReturnValue({
      selectedVillageCodeId: 1,
      setSelectedVillageCodeId: vi.fn(),
      villageCodes: [{ id: 1, name: "Village Alpha" }],
      isLoading: false,
      isError: false,
      error: null,
    });

    const { container } = render(
      <VillageCodeProvider>
        <ScanFacePage />
        <Toaster />
      </VillageCodeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "Capture" }));
    await screen.findByText("No matches found");
    await user.click(
      screen.getByRole("button", { name: "Register New Patient" }),
    );

    await user.type(container.querySelector('input[name="name"]')!, "John Doe");
    await user.type(
      container.querySelector('input[name="identificationNumber"]')!,
      "ID123",
    );
    await user.type(
      container.querySelector('input[name="contactNo"]')!,
      "1234567",
    );
    await user.type(
      container.querySelector('input[name="drugAllergy"]')!,
      "none",
    );
    await user.type(
      container.querySelector('input[name="dateOfBirth"]')!,
      "2000-01-01",
    );
    await user.click(
      container.querySelector('button[name="gender-dropdown-button"]')!,
    );
    await user.click(
      container.querySelector('button[name="gender-male-dropdown-option"]')!,
    );

    await user.click(
      screen.getByRole("button", { name: "Create New Patient" }),
    );

    // When: the creation fails
    act(() => capturedOnError?.(new Error("Server error")));

    // Then: an error toast is shown
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Failed to create patient. Please try again.",
    );
  });

  // --- Camera: null screenshot ---

  it("does not switch to captured state when the webcam returns a null screenshot", async () => {
    const user = userEvent.setup();

    // Given: the webcam returns null instead of image data
    const originalGetScreenshot = Webcam.prototype.getScreenshot;
    Webcam.prototype.getScreenshot = () => null;

    try {
      const { container } = render(<ScanFacePage />);

      // When: the capture button is clicked
      await user.click(screen.getByRole("button", { name: "Capture" }));

      // Then: the page remains in the webcam state with no captured image
      await waitFor(() => {
        expect(document.getElementById("webcam")).toBeInTheDocument();
        expect(
          container.querySelector(
            'img[src="data:image/jpeg;base64,mock-string-data"]',
          ),
        ).not.toBeInTheDocument();
      });
    } finally {
      Webcam.prototype.getScreenshot = originalGetScreenshot;
    }
  });
});
