import "@/styles/globals.css";
import type { AppProps } from "next/app";
import type { NextPage } from "next";
import type { ReactElement, ReactNode } from "react";
import { trpc } from "@/utils/trpc";
import { useRouter } from "next/router";
import withDefaultLayout from "@/components/layouts/withDefaultLayout";
import { Toaster } from "react-hot-toast";
import { Noto_Sans_Khmer } from "next/font/google";

/**
 * Arial has no Khmer glyphs, so without this Khmer text falls back to
 * whatever font the device has (or tofu boxes if none). Only the Khmer
 * subset is loaded; Latin text keeps rendering in Arial.
 */
const notoSansKhmer = Noto_Sans_Khmer({ subsets: ["khmer"] });

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
      {/* Set on :root */}
      <style jsx global>{`
        :root {
          --font-khmer: ${notoSansKhmer.style.fontFamily};
        }
      `}</style>
      <Component
        {...pageProps}
        key={isPatientRoute ? router.asPath : undefined}
      />
      <Toaster />
    </>,
  );
}

export default trpc.withTRPC(App);
