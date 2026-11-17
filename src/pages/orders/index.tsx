import PageHeader from "@/components/PageHeader";
import { PatientPhoto } from "@/components/PatientPhoto";
import { PatientCode } from "@/components/PatientCode";
import LoadingSpinner from "@/components/LoadingSpinner";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import {
  PendingOrderItem,
  type PendingVisit,
} from "@/components/orders/PendingOrderItem";
import { formatVisitDate } from "@/lib/utils/visit";
import { trpc } from "@/utils/trpc";

function Diagnoses({ diagnoses }: { diagnoses: PendingVisit["diagnoses"] }) {
  if (diagnoses.length === 0) {
    return <p className="text-sm text-slate-500">No diagnoses recorded</p>;
  }

  return (
    <ol className="space-y-2 whitespace-normal text-sm text-slate-700">
      {diagnoses.map((diagnosis, index) => (
        <li key={diagnosis.id}>
          <p className="font-semibold text-slate-900">Diagnosis {index + 1}</p>
          {diagnosis.category && <p>Category: {diagnosis.category}</p>}
          <p>{diagnosis.details}</p>
        </li>
      ))}
    </ol>
  );
}

function OrdersBasePage() {
  const {
    data: visits,
    isLoading,
    isError,
  } = trpc.ordersRouter.listPending.useQuery();

  function renderContent() {
    if (isError) {
      return <h1 className="text-red-500">An error has occurred!</h1>;
    }

    if (isLoading) {
      return <LoadingSpinner message="Loading orders..." className="p-12" />;
    }

    if (!visits || visits.length === 0) {
      return (
        <div className="p-12 text-center text-slate-500">
          No pending orders. Orders placed during consults will appear here.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <TableHeader
            headers={["Patient", "Visit On", "Diagnoses", "Prescriptions"]}
          />
          <tbody className="divide-y divide-slate-200 bg-white">
            {visits.map((visit) => (
              <TableRow key={visit.visitId} className="align-top">
                <TableCell>
                  <div className="flex w-32 flex-col items-center gap-1 text-center text-sm">
                    <PatientCode
                      villageCode={visit.villageCode}
                      villageColorHex={visit.villageColorHex}
                      id={visit.patientId}
                      className="font-medium text-slate-900"
                    />
                    <p className="whitespace-normal text-slate-900">
                      {visit.patientName}
                    </p>
                    <PatientPhoto
                      pictureUrl={visit.patientImageUrl}
                      className="h-20 w-20 rounded-lg border border-slate-200 object-cover"
                    />
                  </div>
                </TableCell>
                <TableCell className="text-sm text-slate-700">
                  {formatVisitDate(visit.visitDate)}
                </TableCell>
                <TableCell>
                  <div className="w-48 sm:w-64">
                    <Diagnoses diagnoses={visit.diagnoses} />
                  </div>
                </TableCell>
                <TableCell>
                  <ul className="w-80 divide-y divide-slate-200 sm:w-96">
                    {visit.orders.map((order) => (
                      <PendingOrderItem key={order.id} order={order} />
                    ))}
                  </ul>
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
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Orders" }]}
        title="Orders"
        description="Approve or cancel pending prescriptions."
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {renderContent()}
      </div>
    </div>
  );
}

export default OrdersBasePage;
