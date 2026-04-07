// src/components/layouts/withDefaultLayout.tsx
import { SessionProvider } from "@/lib/context/SessionContext";
import { PatientsProvider } from "@/lib/context/PatientsContext";
import SidebarLayout from "./SidebarLayout";
import type { ReactNode } from "react";

const withDefaultLayout = (page: ReactNode) => (
  <SessionProvider>
    <PatientsProvider>
      <SidebarLayout>{page}</SidebarLayout>
    </PatientsProvider>
  </SessionProvider>
);

export default withDefaultLayout;
