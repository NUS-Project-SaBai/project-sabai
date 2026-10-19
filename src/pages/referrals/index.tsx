import { ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { HiOutlineEye, HiOutlinePencilSquare } from "react-icons/hi2";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import PageHeader from "@/components/PageHeader";
import { PatientPhoto } from "@/components/PatientPhoto";
import LoadingSpinner from "@/components/LoadingSpinner";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import SearchInput from "@/components/interactive/inputs/SearchInput";
import { ReferralStateDropdown } from "@/components/referrals/ReferralStateDropdown";
import { useVillageCode } from "@/lib/context/VillageCodeContext";
import useDebounce from "@/hooks/useDebounce";
import { formatPatientCode } from "@/lib/utils/patient";
import { formatVisitDate } from "@/lib/utils/visit";
import { trpc } from "@/utils/trpc";
import { paths } from "@/utils/paths";

const ALL_VILLAGES = "all";

function ReferralsPage() {
  const {
    data: referrals,
    isLoading,
    isError,
  } = trpc.referralRouter.list.useQuery();
  const { villageCodes } = useVillageCode();

  const [searchText, setSearchText] = useState("");
  const [villageFilter, setVillageFilter] = useState(ALL_VILLAGES);
  const debouncedSearchText = useDebounce(searchText, 300);

  const filteredReferrals = useMemo(() => {
    const query = debouncedSearchText.trim().toLowerCase();

    return (referrals ?? []).filter((referral) => {
      if (
        villageFilter !== ALL_VILLAGES &&
        referral.villageCodeId !== Number(villageFilter)
      ) {
        return false;
      }
      if (!query) return true;

      const patientCode = formatPatientCode(
        referral.villageCode,
        referral.patientId,
      ).toLowerCase();
      return (
        patientCode.includes(query) ||
        referral.patientId.toString().includes(query) ||
        referral.patientName.toLowerCase().includes(query)
      );
    });
  }, [referrals, villageFilter, debouncedSearchText]);

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

    if (filteredReferrals.length === 0) {
      return (
        <div className="p-12 text-center text-slate-500">
          No referrals match your search.
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
              "Actions",
              "Referral Status",
            ]}
          />
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredReferrals.map((referral) => (
              <TableRow key={referral.id}>
                <TableCell>
                  <PatientPhoto
                    pictureUrl={referral.patientImageUrl}
                    className="h-16 w-16 rounded-lg border border-slate-200 object-cover"
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    <p className="inline-flex items-center gap-2 font-medium text-slate-900">
                      <span
                        className="h-3 w-3 rounded-full"
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
                  <div className="flex w-44 flex-col gap-2">
                    <Link
                      href={paths.referralsDetail(referral.id)}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white transition hover:bg-emerald-700"
                    >
                      <HiOutlinePencilSquare className="h-5 w-5" />
                      Referral Details
                    </Link>
                    <Link
                      href={paths.consultsDetail(referral.patientId)}
                      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 transition hover:bg-slate-50"
                    >
                      <HiOutlineEye className="h-5 w-5" />
                      Go to consult
                    </Link>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="w-48">
                    <ReferralStateDropdown
                      referralId={referral.id}
                      referralState={referral.referralState}
                    />
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
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          Village
          <select
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value={ALL_VILLAGES}>All villages</option>
            {villageCodes?.map((village) => (
              <option key={village.id} value={village.id}>
                {village.code} ({village.name})
              </option>
            ))}
          </select>
        </label>
        <SearchInput searchText={searchText} setSearchText={setSearchText} />
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {renderContent()}
      </div>
    </div>
  );
}

ReferralsPage.getLayout = (page: ReactNode) => withDefaultLayout(page);

export default ReferralsPage;
