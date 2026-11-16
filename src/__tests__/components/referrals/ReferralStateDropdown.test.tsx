import { Toaster, toast } from "react-hot-toast";
import userEvent from "@testing-library/user-event";
import { act, cleanup, render, screen } from "@testing-library/react";
import { ReferralStateDropdown } from "@/components/referrals/ReferralStateDropdown";
import { REFERRAL_STATES } from "@/lib/constants/referralStates";

// Hoisted so the mock factory and the tests share one typed object.
const { mockTrpc, listInvalidate, getByIdInvalidate } = vi.hoisted(() => {
  const listInvalidate = vi.fn();
  const getByIdInvalidate = vi.fn();
  return {
    listInvalidate,
    getByIdInvalidate,
    mockTrpc: {
      useUtils: vi.fn(() => ({
        referralRouter: {
          list: { invalidate: listInvalidate },
          getById: { invalidate: getByIdInvalidate },
        },
      })),
      referralRouter: {
        updateState: { useMutation: vi.fn() },
      },
    },
  };
});

vi.mock("@/utils/trpc", () => ({ trpc: mockTrpc }));

type MutationOptions = {
  onSuccess: () => Promise<void>;
  onError: () => void;
};

let mutate: ReturnType<typeof vi.fn>;
let mutationOptions: MutationOptions;

function mockMutation(isPending = false) {
  mockTrpc.referralRouter.updateState.useMutation.mockImplementation(
    (options: MutationOptions) => {
      mutationOptions = options;
      return { mutate, isPending };
    },
  );
}

function renderDropdown() {
  return render(
    <>
      <ReferralStateDropdown referralId={7} referralState="New" />
      <Toaster />
    </>,
  );
}

describe("ReferralStateDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    toast.remove();
    mutate = vi.fn();
    mockMutation();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows every referral state with the current one selected", () => {
    // Given - a referral whose current state is New
    renderDropdown();
    // Then - every state is an option, in lifecycle order, with New selected
    const select = screen.getByRole("combobox", { name: "Referral status" });
    expect(select).toHaveValue("New");
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual([
      ...REFERRAL_STATES,
    ]);
  });

  it("saves the new state without sending an outcome", async () => {
    // Given - the dropdown for referral 7
    renderDropdown();
    // When - the user picks Seen
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Referral status" }),
      "Seen",
    );
    // Then - only the id and state are sent, so the saved outcome is left untouched
    expect(mutate).toHaveBeenCalledWith({ id: 7, referralState: "Seen" });
  });

  it("is disabled while the update is saving", () => {
    // Given - a status update is in flight
    mockMutation(true);
    renderDropdown();
    // Then - the dropdown cannot be changed again until it finishes
    expect(
      screen.getByRole("combobox", { name: "Referral status" }),
    ).toBeDisabled();
  });

  it("refreshes referral queries and confirms on success", async () => {
    // Given - the dropdown for referral 7
    renderDropdown();
    // When - the status update succeeds
    await act(() => mutationOptions.onSuccess());
    // Then - the list and this referral's detail are refetched and a success toast shows
    expect(listInvalidate).toHaveBeenCalled();
    expect(getByIdInvalidate).toHaveBeenCalledWith({ id: 7 });
    expect(
      await screen.findByText("Referral status updated"),
    ).toBeInTheDocument();
  });

  it("shows an error toast when the update fails", async () => {
    // Given - the dropdown for referral 7
    renderDropdown();
    // When - the status update fails
    act(() => mutationOptions.onError());
    // Then - the user is told it failed
    expect(
      await screen.findByText("Failed to update referral status"),
    ).toBeInTheDocument();
  });
});
