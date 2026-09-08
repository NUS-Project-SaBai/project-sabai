import { cleanup, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { trpc } from "@/utils/trpc";
import { VillageCodeProvider } from "@/lib/context/VillageCodeContext";
import RegistrationPage from "@/components/scanFace/RegistrationPage";
import { Mode } from "@/types/scan";

vi.mock("@/utils/trpc", () => ({
  trpc: {
    patientsRouter: {
      create: {
        useMutation: vi.fn(),
      },
    },
    villageCodesRouter: {
      list: {
        useQuery: vi.fn(() => ({
          data: [],
          isLoading: false,
          isError: false,
          error: null,
        })),
      },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTrpc = trpc as any;

const noop = vi.fn();

function renderPage(imgDetails: string | null = "data:image/jpeg;base64,x") {
  return render(
    <VillageCodeProvider>
      <RegistrationPage
        imgDetails={imgDetails}
        setImgDetails={noop}
        setMode={noop as unknown as React.Dispatch<React.SetStateAction<Mode>>}
      />
    </VillageCodeProvider>,
  );
}

/** Returns a YYYY-MM-DD string for a patient who turns `years` old today. */
function dobYearsAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

describe("RegistrationPage — child vitals conditional visibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTrpc.patientsRouter.create.useMutation.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("does not show child vitals section on initial render", () => {
    // Given: the registration form is rendered with no DOB entered
    const { container } = renderPage();

    // When: the form is displayed
    const dobInput = container.querySelector('input[name="dateOfBirth"]');

    // Then: the DOB field is present but child vitals fields are not
    expect(dobInput).toBeInTheDocument();
    expect(
      container.querySelector('button[name="scoliosis-dropdown-button"]'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('button[name="pallor-dropdown-button"]'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector('button[name="pubarche-dropdown-button"]'),
    ).not.toBeInTheDocument();
  });

  it("does not show child vitals section for an adult DOB", async () => {
    // Given: the registration form is rendered
    const user = userEvent.setup();
    const { container } = renderPage();

    // When: an adult DOB (age ≥ 18) is entered
    const dobInput = container.querySelector('input[name="dateOfBirth"]')!;
    await user.type(dobInput, dobYearsAgo(25));

    // Then: the child vitals section remains hidden
    await waitFor(() => {
      expect(
        container.querySelector('button[name="scoliosis-dropdown-button"]'),
      ).not.toBeInTheDocument();
    });
  });

  it("shows child vitals section (Scoliosis, Pallor, Pubarche) for a pediatric DOB", async () => {
    // Given: the registration form is rendered
    const user = userEvent.setup();
    const { container } = renderPage();

    // When: a pediatric DOB (age < 18) is entered
    const dobInput = container.querySelector('input[name="dateOfBirth"]')!;
    await user.type(dobInput, dobYearsAgo(10));

    // Then: all three child vitals dropdowns are visible
    await waitFor(() => {
      expect(
        container.querySelector('button[name="scoliosis-dropdown-button"]'),
      ).toBeInTheDocument();
      expect(
        container.querySelector('button[name="pallor-dropdown-button"]'),
      ).toBeInTheDocument();
      expect(
        container.querySelector('button[name="pubarche-dropdown-button"]'),
      ).toBeInTheDocument();
    });
  });

  it("hides child vitals section when DOB is changed from pediatric to adult", async () => {
    // Given: a pediatric DOB has been entered and child vitals are visible
    const user = userEvent.setup();
    const { container } = renderPage();
    const dobInput = container.querySelector('input[name="dateOfBirth"]')!;

    await user.type(dobInput, dobYearsAgo(10));
    await waitFor(() => {
      expect(
        container.querySelector('button[name="scoliosis-dropdown-button"]'),
      ).toBeInTheDocument();
    });

    // When: the DOB is changed to an adult age
    await user.clear(dobInput);
    await user.type(dobInput, dobYearsAgo(25));

    // Then: the child vitals section is hidden
    await waitFor(() => {
      expect(
        container.querySelector('button[name="scoliosis-dropdown-button"]'),
      ).not.toBeInTheDocument();
    });
  });

  it("does not show pubarcheAge field when pubarche is not yet selected", async () => {
    // Given: a pediatric DOB has been entered and child vitals are visible
    const user = userEvent.setup();
    const { container } = renderPage();

    // When: the DOB is set to a pediatric age but pubarche is not selected
    const dobInput = container.querySelector('input[name="dateOfBirth"]')!;
    await user.type(dobInput, dobYearsAgo(10));
    await waitFor(() => {
      expect(
        container.querySelector('button[name="pubarche-dropdown-button"]'),
      ).toBeInTheDocument();
    });

    // Then: the pubarcheAge input is not visible
    expect(
      container.querySelector('input[name="pubarcheAge"]'),
    ).not.toBeInTheDocument();
  });

  it("shows pubarcheAge field when pubarche is set to Yes", async () => {
    // Given: a pediatric DOB has been entered and child vitals are visible
    const user = userEvent.setup();
    const { container } = renderPage();
    const dobInput = container.querySelector('input[name="dateOfBirth"]')!;
    await user.type(dobInput, dobYearsAgo(10));
    await waitFor(() => {
      expect(
        container.querySelector('button[name="pubarche-dropdown-button"]'),
      ).toBeInTheDocument();
    });

    // When: pubarche is set to "Yes"
    await user.click(
      container.querySelector('button[name="pubarche-dropdown-button"]')!,
    );
    await user.click(
      container.querySelector('button[name="pubarche-yes-dropdown-option"]')!,
    );

    // Then: the pubarcheAge input appears
    await waitFor(() => {
      expect(
        container.querySelector('input[name="pubarcheAge"]'),
      ).toBeInTheDocument();
    });
  });

  it("hides pubarcheAge field when pubarche is changed from Yes to No", async () => {
    // Given: a pediatric patient with pubarche set to "Yes" and pubarcheAge visible
    const user = userEvent.setup();
    const { container } = renderPage();
    const dobInput = container.querySelector('input[name="dateOfBirth"]')!;
    await user.type(dobInput, dobYearsAgo(10));
    await waitFor(() => {
      expect(
        container.querySelector('button[name="pubarche-dropdown-button"]'),
      ).toBeInTheDocument();
    });
    await user.click(
      container.querySelector('button[name="pubarche-dropdown-button"]')!,
    );
    await user.click(
      container.querySelector('button[name="pubarche-yes-dropdown-option"]')!,
    );
    await waitFor(() => {
      expect(
        container.querySelector('input[name="pubarcheAge"]'),
      ).toBeInTheDocument();
    });

    // When: pubarche is changed to "No"
    await user.click(
      container.querySelector('button[name="pubarche-dropdown-button"]')!,
    );
    await user.click(
      container.querySelector('button[name="pubarche-no-dropdown-option"]')!,
    );

    // Then: the pubarcheAge input is hidden
    await waitFor(() => {
      expect(
        container.querySelector('input[name="pubarcheAge"]'),
      ).not.toBeInTheDocument();
    });
  });
});
