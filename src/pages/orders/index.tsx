import PageHeader from "@/components/PageHeader";

function OrdersBasePage() {
  return (
    <div className="min-h-screen flex-1 p-8">
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Orders" }]}
        title="Orders"
        description="Manage orders."
      />

      <div className="p-12 text-center text-slate-500">Under construction</div>
    </div>
  );
}

export default OrdersBasePage;
