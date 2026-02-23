import PatientTopMenuLayout from "@/components/layouts/PatientTopMenuLayout";
import { withDefaultLayout } from "@/components/layouts/SidebarLayout";
import PatientDetailSkeleton from "@/components/PatientDetailSkeleton";
import { useRouter } from "next/router";
import { useMemo } from "react";

export default function PatientPage() {
  const router = useRouter();

  const patientId = useMemo(() => {
    const { id } = router.query;
    return typeof id === "string" ? id : null;
  }, [router.query]);

  if (!router.isReady || !patientId) {
    return <PatientDetailSkeleton />;
  }

  return (
    <div>
      <h1>Patient ID: {patientId}</h1>
      <p>Patient name will be displayed here</p>
    </div>
  );
}

PatientPage.getLayout = (page: React.ReactNode) =>
  withDefaultLayout(<PatientTopMenuLayout>{page}</PatientTopMenuLayout>);
