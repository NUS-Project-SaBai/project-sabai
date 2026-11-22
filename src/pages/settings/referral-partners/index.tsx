import { trpc } from "@/utils/trpc";
import PageHeader from "@/components/PageHeader";
import LoadingSpinner from "@/components/LoadingSpinner";
import TableHeader from "@/components/TableHeader";
import AddPartnerModal from "@/components/referral-partners/AddPartnerModal";
import PartnerRow from "@/components/referral-partners/PartnerRow";
import { paths } from "@/utils/paths";

function ReferralPartnersPage() {
  const {
    data: partners,
    isLoading,
    isError,
  } = trpc.referralPartnersRouter.list.useQuery();

  function renderContent() {
    if (isError) {
      return <h1 className="text-red-500">An error has occurred!</h1>;
    }

    if (isLoading) {
      return (
        <LoadingSpinner
          message="Loading referral partners..."
          className="p-12"
        />
      );
    }

    if (!partners || partners.length === 0) {
      return (
        <div className="p-12 text-center text-slate-500">
          No referral partner found. Add a new record to get started.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <TableHeader headers={["Name", "Remarks", "Active", "Actions"]} />
          <tbody className="bg-white divide-y divide-slate-200">
            {partners.map((partner) => (
              <PartnerRow key={partner.id} {...partner} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl">
        <PageHeader
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Settings", href: paths.settings() },
            { label: "Referral Partners" },
          ]}
          title="Referral Partners"
          description="Manage referral partners."
          actions={<AddPartnerModal />}
        />
        <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default ReferralPartnersPage;
