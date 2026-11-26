import { ReactNode, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import toast from "react-hot-toast";
import { HiOutlineEye } from "react-icons/hi2";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import PageHeader from "@/components/PageHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Button } from "@/components/interactive/Button/Button";
import { AccordionSection } from "@/components/interactive/Accordion";
import { DetailRow } from "@/components/referrals/DetailRow";
import { ReferralOverviewSection } from "@/components/referrals/ReferralOverviewSection";
import { ReferralStateDropdown } from "@/components/referrals/ReferralStateDropdown";
import ReferralsLayout from "@/components/referrals/ReferralsLayout";
import { formatPatientCode } from "@/lib/utils/patient";
import { formatVisitDate } from "@/lib/utils/visit";
import { trpc } from "@/utils/trpc";
import { paths } from "@/utils/paths";

function ReferralDetailsPage() {
  const router = useRouter();
  const referralId = Number(router.query.id);

  const {
    data: referral,
    isLoading,
    isError,
  } = trpc.referralRouter.getById.useQuery(
    { id: referralId },
    { enabled: router.isReady && Number.isInteger(referralId) },
  );

  const utils = trpc.useUtils();
  const [isEditing, setIsEditing] = useState(false);
  const [outcomeDraft, setOutcomeDraft] = useState("");

  const saveOutcome = trpc.referralRouter.updateOutcome.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.referralRouter.getById.invalidate({ id: referralId }),
        utils.referralRouter.list.invalidate(),
      ]);
      setIsEditing(false);
      toast.success("Referral outcome saved");
    },
    onError: () => toast.error("Failed to save referral outcome"),
  });

  if (!router.isReady || isLoading) {
    return <LoadingSpinner message="Loading referral..." className="p-12" />;
  }

  if (isError) {
    return (
      <div className="p-8 text-center font-semibold text-red-500">
        An error has occurred!
      </div>
    );
  }

  if (!referral) {
    return (
      <div className="p-8 text-center font-semibold text-red-500">
        Referral not found
      </div>
    );
  }

  const patientCode = formatPatientCode(
    referral.villageCode,
    referral.patientId,
  );

  const startEditing = () => {
    setOutcomeDraft(referral.referralOutcome ?? "");
    setIsEditing(true);
  };

  return (
    <div className="min-h-screen flex-1 p-4 sm:p-6">
      <PageHeader
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Referrals", href: paths.referrals() },
          { label: "Referral Details" },
        ]}
        title="Referral Details"
        description={"Viewing Referral Details"}
      />

      <div className="mb-4 divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <AccordionSection title="Patient Details" defaultOpen>
          <ReferralOverviewSection referral={{ ...referral, patientCode }} />
        </AccordionSection>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <dl className="divide-y divide-slate-100 px-6">
          <DetailRow label="Referral Status">
            <div className="max-w-xs">
              <ReferralStateDropdown
                referralId={referral.id}
                referralState={referral.referralState}
              />
            </div>
          </DetailRow>
          <DetailRow label="Referral Date">
            {formatVisitDate(referral.createdAt)}
          </DetailRow>
          <DetailRow label="Referral Outcome">
            {isEditing ? (
              <div className="space-y-2">
                <label htmlFor="referral-outcome" className="sr-only">
                  Referral outcome
                </label>
                <textarea
                  id="referral-outcome"
                  value={outcomeDraft}
                  onChange={(e) => setOutcomeDraft(e.target.value)}
                  rows={4}
                  placeholder="Enter referral outcome here..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <div className="flex gap-2">
                  <Button
                    title="Save"
                    colour="emerald"
                    loading={saveOutcome.isPending}
                    onClick={() =>
                      saveOutcome.mutate({
                        id: referral.id,
                        referralOutcome: outcomeDraft.trim(),
                      })
                    }
                  />
                  <Button
                    title="Cancel"
                    colour="red"
                    disabled={saveOutcome.isPending}
                    onClick={() => setIsEditing(false)}
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <p className="whitespace-pre-wrap">
                  {referral.referralOutcome || (
                    <span className="text-slate-500">No outcome recorded</span>
                  )}
                </p>
                <Button
                  title="Edit outcome"
                  colour="indigo"
                  onClick={startEditing}
                  className="shrink-0"
                />
              </div>
            )}
          </DetailRow>
          <DetailRow label="Consultation">
            <Link
              href={paths.consultsDetail(referral.patientId)}
              className="inline-flex items-center gap-2 rounded-lg border border-indigo-600 px-3 py-2 text-sm text-indigo-600 transition hover:bg-indigo-50"
            >
              <HiOutlineEye className="h-5 w-5" />
              Go to patient&apos;s consults
            </Link>
          </DetailRow>
        </dl>
      </div>
    </div>
  );
}

ReferralDetailsPage.getLayout = (page: ReactNode) =>
  withDefaultLayout(<ReferralsLayout>{page}</ReferralsLayout>);

export default ReferralDetailsPage;
