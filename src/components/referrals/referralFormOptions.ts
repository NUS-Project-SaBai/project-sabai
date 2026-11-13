import type { DropdownOption } from "@/components/interactive/RHF/RHFDropdown";
import { trpc } from "@/utils/trpc";

const PN_TEAM = "PN";

// Lets a dropdown be cleared back to "nothing chosen" (saved as null).
export const NOT_SELECTED: DropdownOption = {
  label: "Not selected",
  value: "",
};

/**
 * Dropdown options for picking a PN member on a referral. Only PN members can
 * be picked, but the member already saved is kept so they still show if they
 * have since moved team. Team is matched ignoring case and spaces.
 * @param savedMemberId - The member currently saved on the referral, if any.
 */
export function usePnMemberOptions(
  savedMemberId: string | null,
): DropdownOption[] {
  const { data: users } = trpc.usersRouter.list.useQuery();

  return [
    NOT_SELECTED,
    ...(users ?? [])
      .filter(
        (u) =>
          u.team?.trim().toUpperCase() === PN_TEAM || u.id === savedMemberId,
      )
      .map((u) => ({ label: u.name, value: u.id })),
  ];
}
