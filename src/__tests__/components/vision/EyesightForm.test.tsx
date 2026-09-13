import { EyesightForm } from "@/components/vision/EyesightForm";
import { trpc } from "@/utils/trpc";
import { Toaster, toast } from "react-hot-toast";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { ReactNode } from "react";

vi.mock("@/utils/trpc", () => ({
  trpc: {
    useUtils: vi.fn(),
    eyesightRouter: {
      getByVisitId: { useQuery: vi.fn() },
      create: { useMutation: vi.fn() },
      updateByVisitId: { useMutation: vi.fn() },
    },
  },
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockTrpc = trpc as any;

const VISIT_ID = 1;
const VISIT_SELECT = "2026-01-01";

function Wrapper({ children }: { children: ReactNode }) {
  const methods = useForm();
  return <FormProvider {...methods}>{children}</FormProvider>;
}

function renderForm() {
  return render(
    <Wrapper>
      <Toaster />
      <EyesightForm visitId={VISIT_ID} visitSelect={VISIT_SELECT} />
    </Wrapper>,
  );
}

let createMutate: ReturnType<typeof vi.fn>;
let updateMutate: ReturnType<typeof vi.fn>;
let invalidate: ReturnType<typeof vi.fn>;

describe("EyesightForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toast.remove();

    invalidate = vi.fn();
    createMutate = vi.fn(
      (
        _input: unknown,
        opts?: { onSuccess?: () => void; onError?: () => void },
      ) => opts?.onSuccess?.(),
    );
    updateMutate = vi.fn(
      (
        _input: unknown,
        opts?: { onSuccess?: () => void; onError?: () => void },
      ) => opts?.onSuccess?.(),
    );

    mockTrpc.useUtils.mockReturnValue({
      eyesightRouter: { getByVisitId: { invalidate } },
    });
    mockTrpc.eyesightRouter.create.useMutation.mockReturnValue({
      mutate: createMutate,
      isPending: false,
    });
    mockTrpc.eyesightRouter.updateByVisitId.useMutation.mockReturnValue({
      mutate: updateMutate,
      isPending: false,
    });
  });

  test("shows a loading spinner while the query is pending", () => {
    // Given: the eyesight query is still loading
    mockTrpc.eyesightRouter.getByVisitId.useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    // When: the form renders
    renderForm();

    // Then: a loading message is shown and the save button is not rendered
    expect(screen.getByText(/loading vision data/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /save records/i }),
    ).not.toBeInTheDocument();
  });

  test("renders all sections and save button when loaded", () => {
    // Given: the eyesight query has completed with no existing record
    mockTrpc.eyesightRouter.getByVisitId.useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    });

    // When: the form renders
    renderForm();

    // Then: all eye fields and the save button are present
    expect(screen.getByLabelText(/left eye degree/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/right eye degree/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/left eye pinhole/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/right eye pinhole/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /save records/i }),
    ).toBeInTheDocument();
  });

  test("shows an error toast when nothing has changed", async () => {
    // Given: the form is loaded with no existing record and no fields have been edited
    mockTrpc.eyesightRouter.getByVisitId.useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    const user = userEvent.setup();
    renderForm();

    // When: the user clicks save without touching any field
    await user.click(screen.getByRole("button", { name: /save records/i }));

    // Then: an error toast is shown and no mutation is called
    await waitFor(() => {
      expect(screen.getByRole("status").textContent).toBe(
        "No form field changed!",
      );
    });
    expect(createMutate).not.toHaveBeenCalled();
    expect(updateMutate).not.toHaveBeenCalled();
  });

  test("calls create when no existing record and form is dirty", async () => {
    // Given: no existing eyesight record for this visit
    mockTrpc.eyesightRouter.getByVisitId.useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    const user = userEvent.setup();
    renderForm();

    // When: the user enters a valid acuity value and saves
    await user.type(screen.getByLabelText(/left eye degree/i), "6/6");
    await user.click(screen.getByRole("button", { name: /save records/i }));

    // Then: create is called with the correct payload and update is not called
    await waitFor(() => expect(createMutate).toHaveBeenCalledTimes(1));

    expect(createMutate).toHaveBeenCalledWith(
      expect.objectContaining({ visitId: VISIT_ID, leftEyeDegree: "6/6" }),
      expect.anything(),
    );
    expect(updateMutate).not.toHaveBeenCalled();
  });

  test("calls update when an existing record is present and form is dirty", async () => {
    // Given: an existing eyesight record already exists for this visit
    mockTrpc.eyesightRouter.getByVisitId.useQuery.mockReturnValue({
      data: { leftEyeDegree: "6/9", visitId: VISIT_ID },
      isLoading: false,
    });
    const user = userEvent.setup();
    renderForm();

    // When: the user changes a field and saves
    const leftDegreeInput = screen.getByLabelText(/left eye degree/i);
    await user.clear(leftDegreeInput);
    await user.type(leftDegreeInput, "6/6");
    await user.click(screen.getByRole("button", { name: /save records/i }));

    // Then: update is called with the new value and create is not called
    await waitFor(() => expect(updateMutate).toHaveBeenCalledTimes(1));
    expect(updateMutate).toHaveBeenCalledWith(
      expect.objectContaining({ visitId: VISIT_ID, leftEyeDegree: "6/6" }),
      expect.anything(),
    );
    expect(createMutate).not.toHaveBeenCalled();
  });

  test("shows inline validation error for an invalid visual acuity value", async () => {
    // Given: the form is loaded with no existing record
    mockTrpc.eyesightRouter.getByVisitId.useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    const user = userEvent.setup();
    renderForm();

    // When: the user enters an invalid acuity string and submits
    await user.type(screen.getByLabelText(/left eye degree/i), "abcd");
    await user.click(screen.getByRole("button", { name: /save records/i }));

    // Then: the Zod validation message appears inline and no mutation is called
    await waitFor(() => {
      expect(screen.getByText(/must be VA notation/i)).toBeInTheDocument();
    });
    expect(createMutate).not.toHaveBeenCalled();
  });

  test("disables save button while a mutation is pending", () => {
    // Given: the form is loaded and a mutation is in flight
    mockTrpc.eyesightRouter.getByVisitId.useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
    });
    mockTrpc.eyesightRouter.create.useMutation.mockReturnValue({
      mutate: createMutate,
      isPending: true,
    });

    // When: the form renders
    renderForm();

    // Then: the save button is disabled
    expect(
      screen.getByRole("button", { name: /save records/i }),
    ).toBeDisabled();
  });
});
