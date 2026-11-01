import { SessionProvider } from "@/lib/context/SessionContext";
import { VillageCodeProvider } from "@/lib/context/VillageCodeContext";
import SidebarLayout from "./SidebarLayout";
import type { ReactNode } from "react";

const withDefaultLayout = (page: ReactNode) => (
  <SessionProvider>
    <VillageCodeProvider>
      <SidebarLayout>{page}</SidebarLayout>
    </VillageCodeProvider>
  </SessionProvider>
);

export default withDefaultLayout;
