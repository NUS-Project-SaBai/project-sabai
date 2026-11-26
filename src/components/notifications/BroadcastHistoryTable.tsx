import { trpc } from "@/utils/trpc";
import LoadingSpinner from "@/components/LoadingSpinner";
import TableHeader from "@/components/TableHeader";
import TableRow from "@/components/TableRow";
import TableCell from "@/components/TableCell";
import SeverityPill from "@/components/notifications/SeverityPill";
import ExpandableText from "@/components/notifications/ExpandableText";
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

  // A failed background refetch keeps the cached rows, so only show the error
  // when there is nothing to display.
  if (isError && !broadcasts) {
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
                <TableCell className="font-medium">
                  {/* Titles can be up to 255 chars; wrap them like bodies. */}
                  <p className="max-w-xs whitespace-normal break-words">
                    {broadcast.title}
                  </p>
                </TableCell>
                <TableCell>
                  {/* Bodies can be long; let them wrap instead of widening the table. */}
                  <ExpandableText
                    text={broadcast.body}
                    className="min-w-64 max-w-md"
                  />
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
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold break-words text-slate-900">
          {broadcast.title}
        </p>
        <SeverityPill severity={broadcast.severity} />
      </div>
      <ExpandableText
        text={broadcast.body}
        className="leading-relaxed text-slate-700"
      />
      <p className="text-xs text-slate-500">
        {senderLabel(broadcast)} · {formatVisitDate(broadcast.createdAt)}
      </p>
    </li>
  );
}
