import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  GUARDIANS_NOT_APPLICABLE_TOOLTIP,
  ReferralBoothSection,
  type ReferralBooth,
} from "@/components/referrals/ReferralBoothSection";

const mockMutate = vi.fn();

const mockTrpc = vi.hoisted(() => ({
  useUtils: vi.fn(() => ({
    referralRouter: { getById: { invalidate: vi.fn() } },
  })),
  referralRouter: {
    updateBooth: { useMutation: vi.fn() },
  },
  referralPartnersRouter: {
    list: { useQuery: vi.fn() },
  },
  usersRouter: {
    list: { useQuery: vi.fn() },
  },
}));

vi.mock("@/utils/trpc", () => ({ trpc: mockTrpc }));

const PARTNER_ACTIVE = "11111111-1111-4111-8111-111111111111";
const PARTNER_INACTIVE = "22222222-2222-4222-8222-222222222222";
const PARTNER_SAVED_INACTIVE = "33333333-3333-4333-8333-333333333333";
const PN_MEMBER = "44444444-4444-4444-8444-444444444444";
const PL_MEMBER = "55555555-5555-4555-8555-555555555555";
const FORMER_PN_MEMBER = "66666666-6666-4666-8666-666666666666";

const PARTNERS = [
  { id: PARTNER_ACTIVE, name: "Angkor Hospital", isActive: true },
  { id: PARTNER_INACTIVE, name: "Closed Clinic", isActive: false },
  { id: PARTNER_SAVED_INACTIVE, name: "Old Clinic", isActive: false },
];

const USERS = [
  { id: PN_MEMBER, name: "Pat Nguyen", team: "PN" },
  { id: PL_MEMBER, name: "Lee Park", team: "PL" },
  { id: FORMER_PN_MEMBER, name: "Sam Former", team: "PL" },
];

const REFERRAL_DATE = new Date("2026-10-12T09:00:00");

const MINOR_REFERRAL: ReferralBooth = {
  id: 11,
  createdAt: REFERRAL_DATE,
  patientDateOfBirth: new Date("2015-03-01T00:00:00"), // 11 at referral
  referredToId: null,
  memberInChargeId: null,
  guardiansContacted: null,
  classOfService: null,
  descriptionOfService: null,
  patientSummaryFromScreening: null,
  remarksAtBooth: null,
};

const ADULT_REFERRAL: ReferralBooth = {
  ...MINOR_REFERRAL,
  patientDateOfBirth: new Date("1990-05-17T00:00:00"),
};

function renderBooth(referral: ReferralBooth) {
  return render(<ReferralBoothSection referral={referral} />);
}

// RHFDropdown buttons have no accessible name of their own; find them by
// their form field name instead.
function openDropdown(container: HTMLElement, name: string) {
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

describe("ReferralBoothSection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTrpc.referralRouter.updateBooth.useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
    mockTrpc.referralPartnersRouter.list.useQuery.mockReturnValue({
      data: PARTNERS,
    });
    mockTrpc.usersRouter.list.useQuery.mockReturnValue({ data: USERS });
  });

  afterEach(() => {
    cleanup();
  });

  describe("guardians contacted", () => {
    it("is an enabled checkbox for a minor", () => {
      // Given - a patient who was under 18 when referred
      renderBooth(MINOR_REFERRAL);
      // Then - the checkbox can be ticked
      expect(
        screen.getByRole("checkbox", { name: "Guardians contacted" }),
      ).toBeEnabled();
    });

    it("is greyed out with an explanation for an adult", async () => {
      // Given - a patient who was 18 or over when referred
      const user = userEvent.setup();
      renderBooth(ADULT_REFERRAL);
      const checkbox = screen.getByRole("checkbox", {
        name: "Guardians contacted",
      });
      // Then - the checkbox is disabled and explains why
      expect(checkbox).toBeDisabled();
      expect(checkbox).toHaveAccessibleDescription(
        GUARDIANS_NOT_APPLICABLE_TOOLTIP,
      );
      // When - it is hovered
      await user.hover(checkbox.closest("label")!);
      // Then - the tooltip shows
      expect(screen.getByRole("tooltip")).toHaveTextContent(
        GUARDIANS_NOT_APPLICABLE_TOOLTIP,
      );
    });

    it("uses the age on the referral date, not today", () => {
      // Given - a patient who was 17 when referred but has since turned 18
      renderBooth({
        ...MINOR_REFERRAL,
        createdAt: new Date("2023-12-20T09:00:00"),
        patientDateOfBirth: new Date("2006-01-01T00:00:00"),
      });
      // Then - the checkbox still applies
      expect(
        screen.getByRole("checkbox", { name: "Guardians contacted" }),
      ).toBeEnabled();
    });

    it("starts ticked when guardians were already contacted", () => {
      // Given - a saved referral where guardians were contacted
      renderBooth({ ...MINOR_REFERRAL, guardiansContacted: "Yes" });
      // Then - the checkbox is ticked
      expect(
        screen.getByRole("checkbox", { name: "Guardians contacted" }),
      ).toBeChecked();
    });
  });

  describe("dropdowns", () => {
    it("offers only active clinics, plus the one already saved", async () => {
      // Given - a referral saved against a clinic that was since deactivated
      const user = userEvent.setup();
      const { container } = renderBooth({
        ...MINOR_REFERRAL,
        referredToId: PARTNER_SAVED_INACTIVE,
      });
      // When - the clinic dropdown is opened
      await user.click(openDropdown(container, "referredToId"));
      // Then - other inactive clinics are left out
      expect(dropdownOptionLabels(container, "referredToId")).toEqual([
        "Not selected",
        "Angkor Hospital",
        "Old Clinic (inactive)",
      ]);
    });

    it("offers every class of service", async () => {
      // Given - the booth section is open
      const user = userEvent.setup();
      const { container } = renderBooth(MINOR_REFERRAL);
      // When - the class of service dropdown is opened
      await user.click(openDropdown(container, "classOfService"));
      // Then - all four classes are offered, Imaging/Diagnostics as one
      expect(dropdownOptionLabels(container, "classOfService")).toEqual([
        "Not selected",
        "Chronic Management",
        "Imaging/Diagnostics",
        "Definitive Treatment",
        "Symptomatic Treatment",
      ]);
    });

    it("offers only PN members, plus the one already saved", async () => {
      // Given - a referral saved against someone who has since left PN
      const user = userEvent.setup();
      const { container } = renderBooth({
        ...MINOR_REFERRAL,
        memberInChargeId: FORMER_PN_MEMBER,
      });
      // When - the member dropdown is opened
      await user.click(openDropdown(container, "memberInChargeId"));
      // Then - only PN members and the saved member are offered
      expect(dropdownOptionLabels(container, "memberInChargeId")).toEqual([
        "Not selected",
        "Pat Nguyen",
        "Sam Former",
      ]);
    });
  });

  describe("saving", () => {
    it("saves every booth field for a minor", async () => {
      // Given - a minor's booth section
      const user = userEvent.setup();
      const { container } = renderBooth(MINOR_REFERRAL);
      // When - every field is filled in and saved
      await user.click(openDropdown(container, "referredToId"));
      await user.click(screen.getByRole("button", { name: "Angkor Hospital" }));
      await user.click(openDropdown(container, "classOfService"));
      await user.click(
        screen.getByRole("button", { name: "Imaging/Diagnostics" }),
      );
      await user.click(openDropdown(container, "memberInChargeId"));
      await user.click(screen.getByRole("button", { name: "Pat Nguyen" }));
      await user.click(
        screen.getByRole("checkbox", { name: "Guardians contacted" }),
      );
      await user.type(
        screen.getByLabelText("Description of service"),
        "X-ray of left arm",
      );
      await user.type(
        screen.getByLabelText("Patient summary from screening"),
        "Fell from a tree",
      );
      await user.type(screen.getByLabelText("Remarks"), "Mother will attend");
      await user.click(screen.getByRole("button", { name: "Save" }));
      // Then - the booth fields are sent
      expect(mockMutate).toHaveBeenCalledWith({
        id: 11,
        referredToId: PARTNER_ACTIVE,
        memberInChargeId: PN_MEMBER,
        guardiansContacted: "Yes",
        classOfService: "ImagingDiagnostics",
        descriptionOfService: "X-ray of left arm",
        patientSummaryFromScreening: "Fell from a tree",
        remarksAtBooth: "Mother will attend",
      });
    });

    it("saves unticked guardians as No and empty dropdowns as null", async () => {
      // Given - a minor's booth section left blank
      const user = userEvent.setup();
      renderBooth(MINOR_REFERRAL);
      // When - it is saved as is
      await user.click(screen.getByRole("button", { name: "Save" }));
      // Then - guardians is No and the dropdowns are cleared
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          referredToId: null,
          memberInChargeId: null,
          classOfService: null,
          guardiansContacted: "No",
        }),
      );
    });

    it("saves guardians as NotApplicable for an adult", async () => {
      // Given - an adult's booth section
      const user = userEvent.setup();
      renderBooth(ADULT_REFERRAL);
      // When - it is saved
      await user.click(screen.getByRole("button", { name: "Save" }));
      // Then - guardians contacted is not applicable
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ guardiansContacted: "NotApplicable" }),
      );
    });

    it("can clear a saved clinic", async () => {
      // Given - a referral with a saved clinic
      const user = userEvent.setup();
      const { container } = renderBooth({
        ...MINOR_REFERRAL,
        referredToId: PARTNER_ACTIVE,
      });
      // When - the clinic is set back to Not selected and saved
      await user.click(openDropdown(container, "referredToId"));
      const menu = openDropdown(container, "referredToId").parentElement!;
      await user.click(
        within(menu).getByRole("button", { name: "Not selected" }),
      );
      await user.click(screen.getByRole("button", { name: "Save" }));
      // Then - the clinic is cleared
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({ referredToId: null }),
      );
    });
  });
});
