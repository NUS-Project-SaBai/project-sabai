import { ReactNode } from "react";
import Link from "next/link";
import { HiOutlineEye, HiOutlinePencilSquare } from "react-icons/hi2";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import PageHeader from "@/components/PageHeader";
import { PatientPhoto } from "@/components/PatientPhoto";
import LoadingSpinner from "@/components/LoadingSpinner";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import { ReferralStateDropdown } from "@/components/referrals/ReferralStateDropdown";
import { formatPatientCode } from "@/lib/utils/patient";
import { formatVisitDate } from "@/lib/utils/visit";
import { trpc } from "@/utils/trpc";
import { paths } from "@/utils/paths";

function ReferralsPage() {
  const {
    data: referrals,
    isLoading,
    isError,
  } = trpc.referralRouter.list.useQuery();

  function renderContent() {
    if (isError) {
      return <h1 className="text-red-500">An error has occurred!</h1>;
    }

    if (isLoading) {
      return <LoadingSpinner message="Loading referrals..." className="p-12" />;
    }

    if (!referrals || referrals.length === 0) {
      return (
        <div className="p-12 text-center text-slate-500">
          No referrals yet. Referrals made during consults will appear here.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <TableHeader
            headers={[
              "Photo",
              "Referral Summary",
              "Referral Status",
              "Actions",
            ]}
          />
          <tbody className="divide-y divide-slate-200 bg-white">
            {referrals.map((referral) => (
              <TableRow key={referral.id}>
                <TableCell>
                  <PatientPhoto
                    pictureUrl={referral.patientImageUrl}
                    className="h-12 w-12 rounded-lg border border-slate-200 object-cover sm:h-16 sm:w-16"
                  />
                </TableCell>
                <TableCell>
                  <div className="w-28 space-y-1 whitespace-normal text-sm sm:w-auto">
                    <p className="inline-flex items-center gap-2 font-medium text-slate-900">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: referral.villageColorHex }}
                        title={referral.villageCode}
                      />
                      {formatPatientCode(
                        referral.villageCode,
                        referral.patientId,
                      )}
                    </p>
                    <p className="text-slate-900">{referral.patientName}</p>
                    <p className="text-slate-600">
                      Referred for: {referral.referredFor}
                    </p>
                    <p className="text-slate-500">
                      Visited on: {formatVisitDate(referral.consultDate)}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="w-24 sm:w-48">
                    <ReferralStateDropdown
                      referralId={referral.id}
                      referralState={referral.referralState}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex w-24 flex-col gap-2 sm:w-44">
                    <Link
                      href={paths.referralsDetail(referral.id)}
                      className="inline-flex items-center justify-center gap-2 whitespace-normal rounded-lg bg-emerald-600 px-2 py-2 text-center text-xs text-white transition hover:bg-emerald-700 sm:px-3 sm:text-sm"
                    >
                      <HiOutlinePencilSquare className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                      Referral Details
                    </Link>
                    <Link
                      href={paths.consultsDetail(referral.patientId)}
                      className="inline-flex items-center justify-center gap-2 whitespace-normal rounded-lg border border-slate-300 px-2 py-2 text-center text-xs text-slate-800 transition hover:bg-slate-50 sm:px-3 sm:text-sm"
                    >
                      <HiOutlineEye className="h-4 w-4 shrink-0 sm:h-5 sm:w-5" />
                      Go to patient&apos;s consults
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex-1 p-4 sm:p-6">
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Referrals" }]}
        title="Referrals"
        description="Track patients referred for further care."
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {renderContent()}
      </div>
    </div>
  );
}

function ReferralsLayout({ children }: { children: ReactNode }) {
  const { data: referrals } = trpc.referralRouter.list.useQuery();

  const getPatientLink = (patientId: number) => {
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

ReferralsPage.getLayout = (page: ReactNode) =>
  withDefaultLayout(<ReferralsLayout>{page}</ReferralsLayout>);

export default ReferralsPage;
