import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ReferralPartySection,
  type ReferralParty,
} from "@/components/referrals/ReferralPartySection";

const mockMutate = vi.fn();

const mockTrpc = vi.hoisted(() => ({
  useUtils: vi.fn(() => ({
    referralRouter: { getById: { invalidate: vi.fn() } },
  })),
  referralRouter: {
    updateParty: { useMutation: vi.fn() },
  },
  usersRouter: {
    list: { useQuery: vi.fn() },
  },
}));

vi.mock("@/utils/trpc", () => ({ trpc: mockTrpc }));

const PN_MEMBER = "44444444-4444-4444-8444-444444444444";
const PL_MEMBER = "55555555-5555-4555-8555-555555555555";
const FORMER_PN_MEMBER = "66666666-6666-4666-8666-666666666666";

const USERS = [
  { id: PN_MEMBER, name: "Pat Nguyen", team: " pn " },
  { id: PL_MEMBER, name: "Lee Park", team: "PL" },
  { id: FORMER_PN_MEMBER, name: "Sam Former", team: null },
];

const BLANK_PARTY: ReferralParty = {
  id: 11,
  memberOnRunId: null,
  presentAtReferralParty: false,
  referralPartyResults: null,
  followUp: false,
  doctorsUpdated: false,
};

function renderParty(referral: ReferralParty) {
  return render(<ReferralPartySection referral={referral} />);
}

// RHFDropdown buttons have no accessible name of their own; find them by
// their form field name instead.
function getDropdownButton(container: HTMLElement, name: string) {
  const button = container.querySelector<HTMLButtonElement>(
    `[name="${name}-dropdown-button"]`,
  );
  if (!button) throw new Error(`No dropdown named ${name}`);
  return button;
}

function dropdownOptionLabels(container: HTMLElement, name: string) {
  return Array.from(
    container.querySelectorAll(`[name^="${name}-"][name$="-dropdown-option"]`),
  ).map((option) => option.textContent);
}

const CHECKBOXES = [
  "Present at referral party",
  "Follow up",
  "Doctors updated",
] as const;

describe("ReferralPartySection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTrpc.referralRouter.updateParty.useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
    mockTrpc.usersRouter.list.useQuery.mockReturnValue({ data: USERS });
  });

  afterEach(() => {
    cleanup();
  });

  it("shows the checkboxes unticked and results empty for a new referral", () => {
    // Given - a referral with nothing recorded at the party yet
    renderParty(BLANK_PARTY);
    // Then - every checkbox starts unticked and the results are empty
    for (const name of CHECKBOXES) {
      expect(screen.getByRole("checkbox", { name })).not.toBeChecked();
    }
    expect(screen.getByLabelText("Referral party results")).toHaveValue("");
  });

  it("shows saved party details", () => {
    // Given - a referral with party details saved
    renderParty({
      ...BLANK_PARTY,
      presentAtReferralParty: true,
      referralPartyResults: "Seen by surgeon",
      followUp: true,
      doctorsUpdated: true,
    });
    // Then - they are filled in
    for (const name of CHECKBOXES) {
      expect(screen.getByRole("checkbox", { name })).toBeChecked();
    }
    expect(screen.getByLabelText("Referral party results")).toHaveValue(
      "Seen by surgeon",
    );
  });

  it("offers only PN members on run, plus the one already saved", async () => {
    // Given - a referral saved against someone who has since left PN
    const user = userEvent.setup();
    const { container } = renderParty({
      ...BLANK_PARTY,
      memberOnRunId: FORMER_PN_MEMBER,
    });
    // When - the member dropdown is opened
    await user.click(getDropdownButton(container, "memberOnRunId"));
    // Then - only PN members (any case or spacing) and the saved member show
    expect(dropdownOptionLabels(container, "memberOnRunId")).toEqual([
      "Not selected",
      "Pat Nguyen",
      "Sam Former",
    ]);
  });

  it("saves every party field", async () => {
    // Given - a new referral's party section
    const user = userEvent.setup();
    const { container } = renderParty(BLANK_PARTY);
    // When - every field is filled in and saved
    await user.click(getDropdownButton(container, "memberOnRunId"));
    await user.click(screen.getByRole("button", { name: "Pat Nguyen" }));
    for (const name of CHECKBOXES) {
      await user.click(screen.getByRole("checkbox", { name }));
    }
    await user.type(
      screen.getByLabelText("Referral party results"),
      "Seen by surgeon",
    );
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then - the party fields are sent
    expect(mockMutate).toHaveBeenCalledWith({
      id: 11,
      memberOnRunId: PN_MEMBER,
      presentAtReferralParty: true,
      referralPartyResults: "Seen by surgeon",
      followUp: true,
      doctorsUpdated: true,
    });
  });

  it("saves unticked checkboxes as false and no member as null", async () => {
    // Given - a referral with party details saved
    const user = userEvent.setup();
    renderParty({
      ...BLANK_PARTY,
      memberOnRunId: PN_MEMBER,
      presentAtReferralParty: true,
      followUp: true,
      doctorsUpdated: true,
    });
    // When - everything is unticked, the member cleared, and it is saved
    for (const name of CHECKBOXES) {
      await user.click(screen.getByRole("checkbox", { name }));
    }
    await user.click(screen.getByRole("button", { name: "Pat Nguyen" }));
    await user.click(screen.getByRole("button", { name: "Not selected" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then - the checkboxes are false and the member is null
    expect(mockMutate).toHaveBeenCalledWith({
      id: 11,
      memberOnRunId: null,
      presentAtReferralParty: false,
      referralPartyResults: "",
      followUp: false,
      doctorsUpdated: false,
    });
  });
});
