import PageHeader from "@/components/PageHeader";
import BroadcastHistoryTable from "@/components/notifications/BroadcastHistoryTable";

function NotificationsPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-5xl">
        <PageHeader
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Notifications" },
          ]}
          title="Notifications"
          description="Send a broadcast to everyone signed in, and see past broadcasts."
        />
        <section aria-labelledby="history-heading">
          <h2
            id="history-heading"
            className="mb-4 text-xl font-semibold text-slate-900"
          >
            History
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow">
            <BroadcastHistoryTable />
          </div>
        </section>
      </div>
    </div>
  );
}

export default NotificationsPage;
