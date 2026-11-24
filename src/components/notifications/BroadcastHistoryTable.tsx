import { trpc } from "@/utils/trpc";
import LoadingSpinner from "@/components/LoadingSpinner";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import SeverityPill from "@/components/notifications/SeverityPill";
import { formatVisitDate } from "@/lib/utils/visit";

export default function BroadcastHistoryTable() {
  // The router already returns the newest broadcasts first.
  const {
    data: broadcasts,
    isLoading,
    isError,
  } = trpc.broadcastsRouter.list.useQuery();

  if (isError) {
    return (
      <p className="p-12 text-center text-red-500">
        Failed to load broadcasts.
      </p>
    );
  }

  if (isLoading) {
    return <LoadingSpinner message="Loading broadcasts..." className="p-12" />;
  }

  if (!broadcasts || broadcasts.length === 0) {
    return <p className="p-12 text-center text-slate-500">No broadcasts yet</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <TableHeader
          headers={["Severity", "Title", "Body", "Sent by", "Sent at"]}
        />
        <tbody className="divide-y divide-slate-200 bg-white">
          {broadcasts.map((broadcast) => (
            <TableRow key={broadcast.id}>
              <TableCell>
                <SeverityPill severity={broadcast.severity} />
              </TableCell>
              <TableCell className="font-medium">{broadcast.title}</TableCell>
              <TableCell>
                {/* Bodies can be long; let them wrap instead of widening the table. */}
                <p className="line-clamp-3 min-w-64 max-w-md whitespace-pre-line">
                  {broadcast.body}
                </p>
              </TableCell>
              <TableCell>{broadcast.senderName ?? "Unknown"}</TableCell>
              <TableCell>{formatVisitDate(broadcast.createdAt)}</TableCell>
            </TableRow>
          ))}
        </tbody>
      </table>
    </div>
  );
}
