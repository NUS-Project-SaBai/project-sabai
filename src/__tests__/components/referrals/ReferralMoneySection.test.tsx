import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  RIELS_AMOUNT_ERROR,
  ReferralMoneySection,
  USD_AMOUNT_ERROR,
  type ReferralMoney,
} from "@/components/referrals/ReferralMoneySection";

const mockMutate = vi.fn();

const mockTrpc = vi.hoisted(() => ({
  useUtils: vi.fn(() => ({
    referralRouter: { getById: { invalidate: vi.fn() } },
  })),
  referralRouter: {
    updateMoney: { useMutation: vi.fn() },
  },
  usersRouter: {
    list: { useQuery: vi.fn() },
  },
}));

vi.mock("@/utils/trpc", () => ({ trpc: mockTrpc }));

const PN_MEMBER = "44444444-4444-4444-8444-444444444444";
const PL_MEMBER = "55555555-5555-4555-8555-555555555555";

const USERS = [
  { id: PN_MEMBER, name: "Pat Nguyen", team: "PN" },
  { id: PL_MEMBER, name: "Lee Park", team: "PL" },
];

const BLANK_MONEY: ReferralMoney = {
  id: 11,
  amountPaidUsd: null,
  amountPaidRiels: null,
  memberWhoPaidId: null,
};

function renderMoney(referral: ReferralMoney) {
  return render(<ReferralMoneySection referral={referral} />);
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

describe("ReferralMoneySection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTrpc.referralRouter.updateMoney.useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
    mockTrpc.usersRouter.list.useQuery.mockReturnValue({ data: USERS });
  });

  afterEach(() => {
    cleanup();
  });

  it("shows saved amounts", () => {
    // Given - a referral with a payment saved
    renderMoney({
      ...BLANK_MONEY,
      amountPaidUsd: "12.50",
      amountPaidRiels: 40000,
    });
    // Then - both amounts are filled in
    expect(screen.getByLabelText("Amount paid (USD)")).toHaveValue(12.5);
    expect(screen.getByLabelText("Amount paid (Riels)")).toHaveValue(40000);
  });

  it("offers only PN members as the member who paid", async () => {
    // Given - the money section
    const user = userEvent.setup();
    const { container } = renderMoney(BLANK_MONEY);
    // When - the member dropdown is opened
    await user.click(getDropdownButton(container, "memberWhoPaidId"));
    // Then - only PN members are offered
    expect(dropdownOptionLabels(container, "memberWhoPaidId")).toEqual([
      "Not selected",
      "Pat Nguyen",
    ]);
  });

  it("saves the USD amount as an exact string and riels as a number", async () => {
    // Given - the money section
    const user = userEvent.setup();
    const { container } = renderMoney(BLANK_MONEY);
    // When - both amounts and the member are filled in and saved
    await user.type(screen.getByLabelText("Amount paid (USD)"), "1234.56");
    await user.type(screen.getByLabelText("Amount paid (Riels)"), "40000");
    await user.click(getDropdownButton(container, "memberWhoPaidId"));
    await user.click(screen.getByRole("button", { name: "Pat Nguyen" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then - the money fields are sent
    expect(mockMutate).toHaveBeenCalledWith({
      id: 11,
      amountPaidUsd: "1234.56",
      amountPaidRiels: 40000,
      memberWhoPaidId: PN_MEMBER,
    });
  });

  it("saves blank amounts and no member as null", async () => {
    // Given - a referral with a payment saved
    const user = userEvent.setup();
    renderMoney({
      id: 11,
      amountPaidUsd: "12.50",
      amountPaidRiels: 40000,
      memberWhoPaidId: PN_MEMBER,
    });
    // When - everything is cleared and saved
    await user.clear(screen.getByLabelText("Amount paid (USD)"));
    await user.clear(screen.getByLabelText("Amount paid (Riels)"));
    await user.click(screen.getByRole("button", { name: "Pat Nguyen" }));
    await user.click(screen.getByRole("button", { name: "Not selected" }));
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then - every money field is null
    expect(mockMutate).toHaveBeenCalledWith({
      id: 11,
      amountPaidUsd: null,
      amountPaidRiels: null,
      memberWhoPaidId: null,
    });
  });

  it("rejects a USD amount with more than 2 decimals", async () => {
    // Given - the money section
    const user = userEvent.setup();
    renderMoney(BLANK_MONEY);
    // When - a USD amount with 3 decimals is saved
    await user.type(screen.getByLabelText("Amount paid (USD)"), "12.345");
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then - an error shows and nothing is saved
    expect(await screen.findByText(USD_AMOUNT_ERROR)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("rejects a riels amount that is not a whole number", async () => {
    // Given - the money section
    const user = userEvent.setup();
    renderMoney(BLANK_MONEY);
    // When - a fractional riels amount is saved
    await user.type(screen.getByLabelText("Amount paid (Riels)"), "100.5");
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Then - an error shows and nothing is saved
    expect(await screen.findByText(RIELS_AMOUNT_ERROR)).toBeInTheDocument();
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
