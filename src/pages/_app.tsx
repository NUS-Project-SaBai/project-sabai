import "@/styles/globals.css";
import type { AppProps } from "next/app";
import type { NextPage } from "next";
import type { ReactElement, ReactNode } from "react";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode;
};

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout;
};

function App({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter();

  /**
   * Force remounts only for patient routes to avoid stale-detail flashes when
   * navigating between dynamic patient pages (e.g. /patient/1 -> /patient/2).
   *
   * Why this is here:
   * - Next.js may reuse the same page instance between dynamic route param
   *   changes, which can briefly show previous patient content.
   * - A route-scoped `key` makes React unmount/remount the patient page so
   *   local state and previous render output are reset immediately.
   *
   * Scope:
   * - Applied only to routes under `/patient*`.
   * - Other routes keep normal behavior and are not force-remounted.
   */
  const isPatientRoute = router.pathname.startsWith("/patient");

  const getLayout = Component.getLayout ?? withDefaultLayout;

  return getLayout(
    <>
      <Component
        {...pageProps}
        key={isPatientRoute ? router.asPath : undefined}
      />
    </>,
  );
}

export default trpc.withTRPC(App);
