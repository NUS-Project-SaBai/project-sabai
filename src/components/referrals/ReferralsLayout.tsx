import { ReactNode } from "react";
import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import { trpc } from "@/utils/trpc";
import { paths } from "@/utils/paths";

/**
 * Patient search bar for the referrals pages. Picking a patient opens their
 * latest referral, or their patient page if they have never been referred.
 */
export default function ReferralsLayout({ children }: { children: ReactNode }) {
  const { data: referrals } = trpc.referralRouter.list.useQuery();

  const getPatientLink = (patientId: number) => {
    // The list is ordered newest first, so the first match is the latest referral.
    const latestReferral = referrals?.find(
      (referral) => referral.patientId === patientId,
    );

    return latestReferral
      ? paths.referralsDetail(latestReferral.id)
      : paths.patientDetail(patientId);
  };

  return (
    <PatientTopMenuLayout getPatientLink={getPatientLink}>
      {children}
    </PatientTopMenuLayout>
  );
}
