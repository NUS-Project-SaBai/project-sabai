import { trpc } from "@/utils/trpc";
import LoadingSpinner from "@/components/LoadingSpinner";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import SeverityPill from "@/components/notifications/SeverityPill";
import { formatVisitDate } from "@/lib/utils/visit";
import type { RouterOutput } from "@/utils/trpc";

type BroadcastRow = RouterOutput["broadcastsRouter"]["list"][number];

function senderLabel(broadcast: BroadcastRow) {
  return broadcast.senderName ?? "Unknown";
}

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
    <>
      {/* Mobile screens: stacked cards, so nothing is cut off or scrolled. */}
      <ul
        aria-label="Broadcast history"
        className="divide-y divide-slate-200 md:hidden"
      >
        {broadcasts.map((broadcast) => (
          <BroadcastCard key={broadcast.id} broadcast={broadcast} />
        ))}
      </ul>

      {/* Larger screens: table */}
      <div className="hidden overflow-x-auto md:block">
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
                  <p className="min-w-64 max-w-md whitespace-pre-line break-words">
                    {broadcast.body}
                  </p>
                </TableCell>
                <TableCell>{senderLabel(broadcast)}</TableCell>
                <TableCell>{formatVisitDate(broadcast.createdAt)}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function BroadcastCard({ broadcast }: { broadcast: BroadcastRow }) {
  return (
    <li className="flex flex-col gap-1 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SeverityPill severity={broadcast.severity} />
        <span className="text-xs text-slate-500">
          {formatVisitDate(broadcast.createdAt)}
        </span>
      </div>
      <p className="font-medium break-words">{broadcast.title}</p>
      <p className="whitespace-pre-line break-words text-sm">
        {broadcast.body}
      </p>
      <p className="text-xs text-slate-500">From {senderLabel(broadcast)}</p>
    </li>
  );
}
