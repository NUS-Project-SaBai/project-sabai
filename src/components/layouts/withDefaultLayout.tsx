// src/components/layouts/withDefaultLayout.tsx
import { SessionProvider } from "@/lib/context/SessionContext";
import { PatientsProvider } from "@/lib/context/PatientsContext";
import { VillageCodeProvider } from "@/lib/context/VillageCodeContext";
import SidebarLayout from "./SidebarLayout";
import type { ReactNode } from "react";

const withDefaultLayout = (page: ReactNode) => (
  <SessionProvider>
    <VillageCodeProvider>
      <PatientsProvider>
        <SidebarLayout>{page}</SidebarLayout>
      </PatientsProvider>
    </VillageCodeProvider>
  </SessionProvider>
);

export default withDefaultLayout;
